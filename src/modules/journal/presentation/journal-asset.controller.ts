import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';

import {
  ApiErrorEnvelopeResponse,
  ApiSuccessEnvelopeResponse,
} from '../../../app/http/swagger-response.decorators';
import type { AuthenticatedUser } from '../../auth/application/authenticated-user';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import { Public } from '../../auth/presentation/decorators/public.decorator';
import { AccessTokenAuthGuard } from '../../auth/presentation/guards/access-token-auth.guard';
import { DeleteTripJournalAssetService } from '../application/services/delete-trip-journal-asset.service';
import { GetTripJournalAssetFileService } from '../application/services/get-trip-journal-asset-file.service';
import { JournalAssetUrlSigningService } from '../application/services/journal-asset-url-signing.service';
import { ListTripJournalAssetsService } from '../application/services/list-trip-journal-assets.service';
import { UploadTripJournalAssetService } from '../application/services/upload-trip-journal-asset.service';
import { MAX_TRIP_JOURNAL_ASSET_BYTES } from '../domain/trip-journal-asset';
import {
  TripJournalAssetListResponseDto,
  TripJournalAssetResponseDto,
  TripJournalAssetUploadResponseDto,
} from './dto/trip-journal-asset-response.dto';
import { UploadTripJournalAssetRequestDto } from './dto/upload-trip-journal-asset-request.dto';

interface UploadedJournalAssetFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

@ApiTags('journal-assets')
@Controller()
export class JournalAssetController {
  constructor(
    private readonly deleteTripJournalAsset: DeleteTripJournalAssetService,
    private readonly getTripJournalAssetFile: GetTripJournalAssetFileService,
    private readonly journalAssetUrlSigning: JournalAssetUrlSigningService,
    private readonly listTripJournalAssets: ListTripJournalAssetsService,
    private readonly uploadTripJournalAsset: UploadTripJournalAssetService,
  ) {}

  @Post('trips/:tripId/journal/assets')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadTripJournalAssetRequestDto })
  @ApiOperation({
    summary: 'Upload an image into the owner journal asset library for a trip.',
  })
  @ApiSuccessEnvelopeResponse(TripJournalAssetUploadResponseDto, {
    description:
      'Returns the uploaded journal asset with a signed read URL.',
    status: 201,
  })
  @ApiErrorEnvelopeResponse({
    description: 'The upload payload is invalid, missing, or exceeds the size limit.',
    status: 400,
  })
  @ApiErrorEnvelopeResponse({
    description: 'Authentication is required.',
    status: 401,
  })
  @ApiErrorEnvelopeResponse({
    description: 'The requested trip does not exist for the authenticated user.',
    status: 404,
  })
  @UseGuards(AccessTokenAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: MAX_TRIP_JOURNAL_ASSET_BYTES,
      },
    }),
  )
  async uploadAsset(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @UploadedFile() file: UploadedJournalAssetFile | undefined,
  ) {
    const result = await this.uploadTripJournalAsset.execute({
      userId: authenticatedUser.userId,
      tripId,
      file:
        file === undefined
          ? null
          : {
              buffer: file.buffer,
              byteSize: file.size,
              contentType: file.mimetype,
              fileName: file.originalname,
            },
    });

    return TripJournalAssetResponseDto.from(
      result.asset,
      this.journalAssetUrlSigning.createSignedPath(result.asset.publicId),
    );
  }

  @Get('trips/:tripId/journal/assets')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List uploaded journal assets for an owned trip.',
  })
  @ApiSuccessEnvelopeResponse(TripJournalAssetListResponseDto, {
    description:
      'Returns the owned trip journal asset library with signed read URLs.',
  })
  @ApiErrorEnvelopeResponse({
    description: 'Authentication is required.',
    status: 401,
  })
  @ApiErrorEnvelopeResponse({
    description: 'The requested trip does not exist for the authenticated user.',
    status: 404,
  })
  @UseGuards(AccessTokenAuthGuard)
  async listAssets(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('tripId') tripId: string,
  ) {
    const result = await this.listTripJournalAssets.execute({
      userId: authenticatedUser.userId,
      tripId,
    });

    return TripJournalAssetResponseDto.list(result.assets, (asset) =>
      this.journalAssetUrlSigning.createSignedPath(asset.publicId),
    );
  }

  @Delete('trips/:tripId/journal/assets/:assetId')
  @HttpCode(204)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an uploaded journal asset from an owned trip.' })
  @ApiNoContentResponse({
    description: 'Deletes the owned trip journal asset and its stored file.',
  })
  @ApiErrorEnvelopeResponse({
    description: 'Authentication is required.',
    status: 401,
  })
  @ApiErrorEnvelopeResponse({
    description:
      'The requested trip or journal asset does not exist for the authenticated user.',
    status: 404,
  })
  @UseGuards(AccessTokenAuthGuard)
  async deleteAsset(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Param('assetId') assetId: string,
  ) {
    await this.deleteTripJournalAsset.execute({
      userId: authenticatedUser.userId,
      tripId,
      assetId,
    });
  }

  @Get('journal-assets/:publicId')
  @Public()
  @ApiOperation({
    summary: 'Resolve and stream a signed journal asset file.',
  })
  @ApiProduces('image/png', 'image/jpeg', 'image/webp', 'image/gif')
  @ApiQuery({
    name: 'expiresAt',
    description: 'Signed URL expiration timestamp in milliseconds since epoch.',
    required: true,
  })
  @ApiQuery({
    name: 'signature',
    description: 'Signed URL signature generated for the journal asset path.',
    required: true,
  })
  @ApiOkResponse({
    description: 'Streams the journal asset binary when the signed URL is valid.',
    schema: {
      format: 'binary',
      type: 'string',
    },
  })
  @ApiErrorEnvelopeResponse({
    description:
      'The journal asset does not exist, or the signed URL is invalid or expired.',
    status: 404,
  })
  async getAsset(
    @Param('publicId') publicId: string,
    @Query('expiresAt') expiresAt: string | undefined,
    @Query('signature') signature: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.getTripJournalAssetFile.execute({
      publicId,
      expiresAt,
      signature,
    });

    response.setHeader('Content-Type', result.asset.contentType);
    response.setHeader('Content-Length', result.file.byteSize);
    response.setHeader(
      'Cache-Control',
      `private, max-age=${result.cacheMaxAgeSeconds}, must-revalidate`,
    );
    result.file.stream.pipe(response);
  }
}
