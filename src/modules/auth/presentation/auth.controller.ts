import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';

import type { AuthenticatedUser } from '../application/authenticated-user';
import { LoginUserService } from '../application/services/login-user.service';
import { LogoutAuthSessionService } from '../application/services/logout-auth-session.service';
import { RefreshAuthSessionService } from '../application/services/refresh-auth-session.service';
import { RegisterAuthSessionService } from '../application/services/register-auth-session.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthSessionResponseDto } from './dto/auth-session-response.dto';
import { CurrentUserResponseDto } from './dto/current-user-response.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { LogoutRequestDto } from './dto/logout-request.dto';
import { LogoutResponseDto } from './dto/logout-response.dto';
import { RefreshAuthSessionResponseDto } from './dto/refresh-auth-session-response.dto';
import { RefreshTokenRequestDto } from './dto/refresh-token-request.dto';
import { RegisterRequestDto } from './dto/register-request.dto';
import { UpdateCurrentUserRequestDto } from './dto/update-current-user-request.dto';
import { AccessTokenAuthGuard } from './guards/access-token-auth.guard';
import { MAX_USER_AVATAR_BYTES } from '../../users/domain/user-avatar';
import { DeleteUserAvatarService } from '../../users/application/services/delete-user-avatar.service';
import { UploadUserAvatarService } from '../../users/application/services/upload-user-avatar.service';
import { GetUserProfileService } from '../../users/application/services/get-user-profile.service';
import { UpdateUserProfileService } from '../../users/application/services/update-user-profile.service';

interface UploadedUserAvatarRequestFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth')
@UseGuards(AccessTokenAuthGuard)
export class AuthController {
  constructor(
    private readonly registerAuthSession: RegisterAuthSessionService,
    private readonly loginUser: LoginUserService,
    private readonly logoutAuthSession: LogoutAuthSessionService,
    private readonly refreshAuthSession: RefreshAuthSessionService,
    private readonly deleteUserAvatar: DeleteUserAvatarService,
    private readonly getUserProfile: GetUserProfileService,
    private readonly updateUserProfile: UpdateUserProfileService,
    private readonly uploadUserAvatar: UploadUserAvatarService,
  ) {}

  @Public()
  @Post('register')
  async register(@Body() input: RegisterRequestDto) {
    const session = await this.registerAuthSession.execute({
      email: input.email,
      password: input.password,
      displayName: input.displayName ?? null,
    });

    return AuthSessionResponseDto.from(session);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() input: LoginRequestDto) {
    const session = await this.loginUser.execute(input);

    return AuthSessionResponseDto.from(session);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() input: RefreshTokenRequestDto) {
    const tokens = await this.refreshAuthSession.execute(input);

    return RefreshAuthSessionResponseDto.from(tokens);
  }

  @Public()
  @Post('logout')
  @HttpCode(200)
  async logout(@Body() input: LogoutRequestDto) {
    const result = await this.logoutAuthSession.execute(input);

    return LogoutResponseDto.from(result);
  }

  @Get('me')
  async me(@CurrentUser() authenticatedUser: AuthenticatedUser) {
    const user = await this.getUserProfile.execute({
      userId: authenticatedUser.userId,
    });

    return CurrentUserResponseDto.from(user);
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Body() input: UpdateCurrentUserRequestDto,
  ) {
    const user = await this.updateUserProfile.execute({
      userId: authenticatedUser.userId,
      displayName: input.displayName,
    });

    return CurrentUserResponseDto.from(user);
  }

  @Post('me/avatar')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: MAX_USER_AVATAR_BYTES,
      },
    }),
  )
  async uploadAvatar(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @UploadedFile() file: UploadedUserAvatarRequestFile | undefined,
  ) {
    const user = await this.uploadUserAvatar.execute({
      userId: authenticatedUser.userId,
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

    return CurrentUserResponseDto.from(user);
  }

  @Delete('me/avatar')
  @HttpCode(200)
  async deleteAvatar(@CurrentUser() authenticatedUser: AuthenticatedUser) {
    const user = await this.deleteUserAvatar.execute({
      userId: authenticatedUser.userId,
    });

    return CurrentUserResponseDto.from(user);
  }
}
