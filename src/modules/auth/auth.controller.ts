import { Controller, Post, Body, HttpCode, HttpStatus, Ip } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user and get JWT token' })
  async login(
    @Body() loginDto: CreateUserDto,
    @Ip() ip: string, // <--- Add this decorator to get the requester's IP
  ) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    
    // Now passing two arguments as required by the updated AuthService
    return this.authService.login(user, ip);
  }
}