import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { GetUserAvatarFileService } from '../application/services/get-user-avatar-file.service';

@ApiTags('user-avatars')
@Controller('user-avatars')
export class UserAvatarController {
  constructor(private readonly getUserAvatarFile: GetUserAvatarFileService) {}

  @Get(':publicId')
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
