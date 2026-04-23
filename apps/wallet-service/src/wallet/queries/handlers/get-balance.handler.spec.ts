import { Test, TestingModule } from '@nestjs/testing';
import { GetBalanceHandler } from './get-balance.handler.js';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Wallet } from '../../entities/wallet.entity.js';
import { GetBalanceQuery } from '../impl/get-balance.query.js';
import { BadRequestException } from '@nestjs/common';

describe('GetBalanceHandler', () => {
  let handler: GetBalanceHandler;
  let repo: any;

  const mockRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetBalanceHandler,
        {
          provide: getRepositoryToken(Wallet),
          useValue: mockRepo,
        },
      ],
    }).compile();

    handler = module.get<GetBalanceHandler>(GetBalanceHandler);
    repo = module.get(getRepositoryToken(Wallet));
  });

  it('should return balance if wallet exists', async () => {
    const query = new GetBalanceQuery('u1');
    repo.findOne.mockResolvedValue({ balance: 150 });

    const result = await handler.execute(query);

    expect(result).toBe(150);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { userId: 'u1' } });
  });

  it('should throw BadRequestException if wallet not found', async () => {
    const query = new GetBalanceQuery('u1');
    repo.findOne.mockResolvedValue(null);

    await expect(handler.execute(query)).rejects.toThrow(BadRequestException);
  });
});
