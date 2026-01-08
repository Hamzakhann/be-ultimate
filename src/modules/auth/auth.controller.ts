import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: CreateUserDto) {
    // 1. Get the user (or throw Unauthorized)
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    
    // 2. Pass that user object to login()
    return this.authService.login(user);
  }
}