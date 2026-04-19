import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service.js';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { TransactionStatus, TransactionType } from './entities/transaction.entity.js';
import { Wallet } from './entities/wallet.entity.js';

describe('WalletService', () => {
  let service: WalletService;
  let dataSource: any;
  let kafkaClient: any;
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
    getRepository: jest.fn(() => ({
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    })),
    createQueryRunner: jest.fn(() => mockQueryRunner),
  };

  const mockKafkaClient = {
    connect: jest.fn(),
    emit: jest.fn(),
  };

  const mockUserGrpcClient = {
    getService: jest.fn(() => ({
      findOne: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: 'KAFKA_SERVICE', useValue: mockKafkaClient },
        { provide: 'USER_PACKAGE', useValue: mockUserGrpcClient },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    dataSource = module.get(DataSource);
    kafkaClient = module.get('KAFKA_SERVICE');
    userGrpcService = mockUserGrpcClient.getService();

    // Mock the gRPC service initialization in onModuleInit
    (service as any).userService = userGrpcService;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('transferFunds', () => {
    const fromUserId = 'u1';
    const toUserId = 'u2';
    const amount = 50;
    const ip = '127.0.0.1';

    it('should successfully transfer funds', async () => {
      // Mock gRPC validation
      userGrpcService.findOne.mockReturnValue(of({ id: toUserId, isActive: true }));

      // Mock Wallet lookups in transaction
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce({ ...mockWallet }) // Sender
        .mockResolvedValueOnce({ ...mockReceiverWallet }); // Receiver

      // Mock Transaction creation
      const mockTx = { id: 'tx1' };
      mockQueryRunner.manager.create.mockReturnValue(mockTx);

      const result = await service.transferFunds(fromUserId, toUserId, amount, ip);

      expect(result.success).toBe(true);
      expect(mockQueryRunner.manager.save).toHaveBeenCalledTimes(3); // Sender, Receiver, Transaction
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(kafkaClient.emit).toHaveBeenCalledWith('transaction.events', expect.objectContaining({
        value: expect.objectContaining({ status: 'SUCCESS' })
      }));
    });

    it('should throw BadRequestException if insufficient funds', async () => {
      userGrpcService.findOne.mockReturnValue(of({ id: toUserId, isActive: true }));
      
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce({ ...mockWallet, balance: 10 }) // Low balance
        .mockResolvedValueOnce({ ...mockReceiverWallet });

      await expect(service.transferFunds(fromUserId, toUserId, amount, ip))
        .rejects.toThrow(BadRequestException);
      
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException for self-transfer', async () => {
      await expect(service.transferFunds(fromUserId, fromUserId, amount, ip))
        .rejects.toThrow('Cannot transfer to self');
    });

    it('should throw NotFoundException if recipient not found via gRPC', async () => {
      userGrpcService.findOne.mockReturnValue(of(null));

      await expect(service.transferFunds(fromUserId, toUserId, amount, ip))
        .rejects.toThrow(NotFoundException);
    });
  });
});
