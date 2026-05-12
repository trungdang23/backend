import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import {
  ApiErrorEnvelopeResponse,
} from '../../../app/http/swagger-response.decorators';
import { GetUserAvatarFileService } from '../application/services/get-user-avatar-file.service';

@ApiTags('user-avatars')
@Controller('user-avatars')
export class UserAvatarController {
  constructor(private readonly getUserAvatarFile: GetUserAvatarFileService) {}

  @Get(':publicId')
  @ApiOperation({ summary: 'Resolve and stream a user avatar file.' })
  @ApiProduces('image/png', 'image/jpeg', 'image/webp', 'image/gif')
  @ApiOkResponse({
    description: 'Streams the avatar image binary.',
    schema: {
      format: 'binary',
      type: 'string',
    },
  })
  @ApiErrorEnvelopeResponse({
    description: 'The requested avatar does not exist.',
    status: 404,
  })
  async getAvatar(
    @Param('publicId') publicId: string,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.getUserAvatarFile.execute({
      publicId,
    });

    response.setHeader('Content-Type', result.contentType);
    response.setHeader('Content-Length', result.file.byteSize);
    response.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    result.file.stream.pipe(response);
  }
}
