import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserProfileQuery } from '../impl/get-user-profile.query.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile } from '../../entities/user-profile.entity.js';
import { RpcException } from '@nestjs/microservices';

@QueryHandler(GetUserProfileQuery)
export class GetUserProfileHandler implements IQueryHandler<GetUserProfileQuery> {
  constructor(
    @InjectRepository(UserProfile)
    private readonly profileRepository: Repository<UserProfile>,
  ) {}

  async execute(query: GetUserProfileQuery) {
    const { userId } = query;
    const profile = await this.profileRepository.findOne({ where: { userId } });

    if (!profile) {
      throw new RpcException({ statusCode: 404, message: 'User profile not found' });
    }

    return profile;
  }
}
