import {
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import type { AuthenticatedUser } from '../../auth/application/authenticated-user';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import { Public } from '../../auth/presentation/decorators/public.decorator';
import { AccessTokenAuthGuard } from '../../auth/presentation/guards/access-token-auth.guard';
import { GetTripJournalAssetFileService } from '../application/services/get-trip-journal-asset-file.service';
import { UploadTripJournalAssetService } from '../application/services/upload-trip-journal-asset.service';
import { MAX_TRIP_JOURNAL_ASSET_BYTES } from '../domain/trip-journal-asset';
import { TripJournalAssetResponseDto } from './dto/trip-journal-asset-response.dto';

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
    private readonly getTripJournalAssetFile: GetTripJournalAssetFileService,
    private readonly uploadTripJournalAsset: UploadTripJournalAssetService,
  ) {}

  @Post('trips/:tripId/journal/assets')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
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

    return TripJournalAssetResponseDto.from(result.asset);
  }

  @Get('journal-assets/:publicId')
  @Public()
  async getAsset(
    @Param('publicId') publicId: string,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.getTripJournalAssetFile.execute(publicId);

    response.setHeader('Content-Type', result.asset.contentType);
    response.setHeader('Content-Length', result.file.byteSize);
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    result.file.stream.pipe(response);
  }
}
