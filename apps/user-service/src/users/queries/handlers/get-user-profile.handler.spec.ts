import { Test, TestingModule } from '@nestjs/testing';
import { GetUserProfileHandler } from './get-user-profile.handler.js';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserProfile } from '../../entities/user-profile.entity.js';
import { GetUserProfileQuery } from '../impl/get-user-profile.query.js';
import { RpcException } from '@nestjs/microservices';

describe('GetUserProfileHandler', () => {
  let handler: GetUserProfileHandler;
  let repo: any;

  const mockRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserProfileHandler,
        {
          provide: getRepositoryToken(UserProfile),
          useValue: mockRepo,
        },
      ],
    }).compile();

    handler = module.get<GetUserProfileHandler>(GetUserProfileHandler);
    repo = module.get(getRepositoryToken(UserProfile));
  });

  it('should return profile if user exists', async () => {
    const query = new GetUserProfileQuery('u1');
    const mockProfile = { userId: 'u1', email: 'test@example.com', name: 'Test' };
    repo.findOne.mockResolvedValue(mockProfile);

    const result = await handler.execute(query);

    expect(result).toEqual(mockProfile);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { userId: 'u1' } });
  });

  it('should throw RpcException if profile not found', async () => {
    const query = new GetUserProfileQuery('u1');
    repo.findOne.mockResolvedValue(null);

    await expect(handler.execute(query)).rejects.toThrow(RpcException);
  });
});
