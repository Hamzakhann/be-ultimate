import { Controller, Post, Body, HttpCode, HttpStatus, Ip } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: CreateUserDto,
    @Ip() ip: string, // <--- Add this decorator to get the requester's IP
  ) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    
    // Now passing two arguments as required by the updated AuthService
    return this.authService.login(user, ip);
  }
}