import { Test, TestingModule } from '@nestjs/testing';
import { TransferMoneyHandler } from './transfer-money.handler.js';
import { DataSource } from 'typeorm';
import { EventBus } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { of } from 'rxjs';
import { Wallet } from '../../entities/wallet.entity.js';
import { TransferMoneyCommand } from '../impl/transfer-money.command.js';
import { MoneyTransferredEvent } from '../../events/impl/money-transferred.event.js';

describe('TransferMoneyHandler', () => {
  let handler: TransferMoneyHandler;
  let dataSource: any;
  let eventBus: EventBus;
  let userGrpcService: any;

  const mockWallet = { id: 'w1', userId: 'u1', balance: 100 } as Wallet;
  const mockReceiverWallet = { id: 'w2', userId: 'u2', balance: 50 } as Wallet;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => mockQueryRunner),
  };

  const mockEventBus = {
    publish: jest.fn(),
  };

  const mockUserGrpcService = {
    findOne: jest.fn(),
  };

  const mockUserGrpcClient = {
    getService: jest.fn(() => mockUserGrpcService),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferMoneyHandler,
        { provide: DataSource, useValue: mockDataSource },
        { provide: EventBus, useValue: mockEventBus },
        { provide: 'USER_PACKAGE', useValue: mockUserGrpcClient },
      ],
    }).compile();

    handler = module.get<TransferMoneyHandler>(TransferMoneyHandler);
    dataSource = module.get(DataSource);
    eventBus = module.get<EventBus>(EventBus);
    userGrpcService = mockUserGrpcService;

    // Mock gRPC service initialization
    handler.onModuleInit();
  });

  it('should successfully transfer funds and publish event', async () => {
    const command = new TransferMoneyCommand('u1', 'u2', 50, '127.0.0.1');

    userGrpcService.findOne.mockReturnValue(of({ id: 'u2', isActive: true }));

    mockQueryRunner.manager.findOne
      .mockResolvedValueOnce({ ...mockWallet })
      .mockResolvedValueOnce({ ...mockReceiverWallet });

    const mockTx = { id: 'tx1' };
    mockQueryRunner.manager.create.mockReturnValue(mockTx);

    const result = await handler.execute(command);

    expect(result.success).toBe(true);
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.any(MoneyTransferredEvent),
    );
  });

  it('should throw BadRequestException if insufficient funds', async () => {
    const command = new TransferMoneyCommand('u1', 'u2', 50, '127.0.0.1');
    userGrpcService.findOne.mockReturnValue(of({ id: 'u2', isActive: true }));

    mockQueryRunner.manager.findOne
      .mockResolvedValueOnce({ ...mockWallet, balance: 10 })
      .mockResolvedValueOnce({ ...mockReceiverWallet });

    await expect(handler.execute(command)).rejects.toThrow(BadRequestException);
    expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('should throw NotFoundException if recipient not found via gRPC', async () => {
    const command = new TransferMoneyCommand('u1', 'u2', 50, '127.0.0.1');
    userGrpcService.findOne.mockReturnValue(of(null));

    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
  });
});
