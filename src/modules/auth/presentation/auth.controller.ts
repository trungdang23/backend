import { Body, Controller, Post } from '@nestjs/common';

import { Public } from './decorators/public.decorator';
import { RegisterRequestDto } from './dto/register-request.dto';
import { RegisterUserService } from '../../users/application/services/register-user.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly registerUser: RegisterUserService) {}

  @Public()
  @Post('register')
  async register(@Body() input: RegisterRequestDto) {
    const user = await this.registerUser.execute({
      email: input.email,
      password: input.password,
      displayName: input.displayName ?? null,
    });

    return {
      user,
    };
  }
}
