import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UsersService } from './users.service.js';

@Controller()
export class UsersGrpcController {
  constructor(private readonly usersService: UsersService) {}

  @GrpcMethod('UserService', 'FindOne')
  async findOne(data: { id: string }) {
    try {
      const profile = await this.usersService.getProfile(data.id);
      return {
        id: profile.userId,
        email: profile.email,
        isActive: profile.isActive,
      };
    } catch (error) {
      return null;
    }
  }
}
