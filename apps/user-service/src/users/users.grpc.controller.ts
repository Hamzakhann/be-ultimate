import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { QueryBus } from '@nestjs/cqrs';
import { GetUserProfileQuery } from './queries/impl/get-user-profile.query.js';
import { status } from '@grpc/grpc-js';

@Controller()
export class UsersGrpcController {
  constructor(private readonly queryBus: QueryBus) {}

  @GrpcMethod('UserService', 'FindOne')
  async findOne(data: { id: string }) {
    const profile = await this.queryBus.execute(new GetUserProfileQuery(data.id));
    
    if (!profile) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `User with ID ${data.id} not found`,
      });
    }

    return {
      id: profile.userId,
      email: profile.email,
      isActive: profile.isActive,
    };
  }
}
