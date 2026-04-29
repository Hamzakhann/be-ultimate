import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { QueryBus } from '@nestjs/cqrs';
import { GetUserProfileQuery } from './queries/impl/get-user-profile.query.js';

@Controller()
export class UsersGrpcController {
  constructor(private readonly queryBus: QueryBus) {}

  @GrpcMethod('UserService', 'FindOne')
  async findOne(data: { id: string }) {
    try {
      const profile = await this.queryBus.execute(new GetUserProfileQuery(data.id));
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
