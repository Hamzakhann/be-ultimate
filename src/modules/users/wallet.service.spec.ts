import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { DataSource } from 'typeorm';

describe('WalletService', () => {
    let service: WalletService;

    // Mocking the DataSource and QueryRunner
    const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
            findOne: jest.fn(),
            save: jest.fn(),
        },
    };

    const mockDataSource = {
        createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
        getRepository: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WalletService,
                { provide: DataSource, useValue: mockDataSource },
            ],
        }).compile();

        service = module.get<WalletService>(WalletService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should throw error if transfer amount is negative', async () => {
        await expect(service.transferFunds('u1', 'u2', -100))
            .rejects.toThrow('Amount must be positive');
    });
});