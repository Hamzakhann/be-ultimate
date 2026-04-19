import { Injectable, BadRequestException, InternalServerErrorException, Inject, OnModuleInit, NotFoundException } from '@nestjs/common';
import * as microservices from '@nestjs/microservices';
import { DataSource } from 'typeorm';
import { Wallet } from './entities/wallet.entity.js';
import { Transaction, TransactionStatus, TransactionType } from './entities/transaction.entity.js';
import { v4 as uuidv4 } from 'uuid';
import { lastValueFrom, Observable } from 'rxjs';

interface UserGrpcService {
  findOne(data: { id: string }): Observable<{ id: string; email: string; isActive: boolean }>;
}

@Injectable()
export class WalletService implements OnModuleInit {
  private userService: UserGrpcService;

  constructor(
    private readonly dataSource: DataSource,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: microservices.ClientKafka,
    @Inject('USER_PACKAGE') private readonly client: microservices.ClientGrpc,
  ) { }

  async onModuleInit() {
    await this.kafkaClient.connect();
    this.userService = this.client.getService<UserGrpcService>('UserService');
  }

  async createWallet(userId: string): Promise<Wallet> {
    const walletRepository = this.dataSource.getRepository(Wallet);

    // Idempotency check: Check if wallet already exists
    const existingWallet = await walletRepository.findOne({ where: { userId } });
    if (existingWallet) {
      return existingWallet;
    }

    const wallet = walletRepository.create({ userId, balance: 0 });
    return await walletRepository.save(wallet);
  }

  async getBalance(userId: string): Promise<number> {
    const wallet = await this.dataSource.getRepository(Wallet).findOne({ where: { userId } });
    if (!wallet) throw new BadRequestException('Wallet not found');
    return Number(wallet.balance);
  }

  async transferFunds(fromUserId: string, toUserId: string, amount: number, ip: string) {
    const correlationId = uuidv4();

    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    if (fromUserId === toUserId) throw new BadRequestException('Cannot transfer to self');

    // NEW: Synchronous validation via gRPC
    try {
      const recipient = await lastValueFrom(this.userService.findOne({ id: toUserId }));
      if (!recipient || !recipient.id) {
        throw new NotFoundException('Recipient not found in User Service');
      }
      if (!recipient.isActive) {
        throw new BadRequestException('Recipient account is inactive');
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to validate recipient via gRPC');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const senderWallet = await queryRunner.manager.findOne(Wallet, {
        where: { userId: fromUserId },
        lock: { mode: 'pessimistic_write' },
      });

      const receiverWallet = await queryRunner.manager.findOne(Wallet, {
        where: { userId: toUserId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!senderWallet || !receiverWallet) {
        throw new BadRequestException('One or more wallets not found');
      }

      if (Number(senderWallet.balance) < amount) {
        throw new BadRequestException('Insufficient funds');
      }

      // 1. Update Balances
      senderWallet.balance = Number(senderWallet.balance) - amount;
      receiverWallet.balance = Number(receiverWallet.balance) + amount;

      await queryRunner.manager.save(senderWallet);
      await queryRunner.manager.save(receiverWallet);

      // 2. Record Transaction
      const transaction = queryRunner.manager.create(Transaction, {
        fromUserId,
        toUserId,
        amount,
        type: TransactionType.TRANSFER,
        status: TransactionStatus.SUCCESS,
        metadata: { ip, correlationId, timestamp: new Date().toISOString() },
      });
      await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();

      // 3. Emit Kafka Event
      this.kafkaClient.emit('transaction.events', {
        key: fromUserId,
        value: {
          status: 'SUCCESS',
          fromUserId,
          toUserId,
          amount,
          transactionId: transaction.id,
          metadata: { ip, timestamp: new Date().toISOString() },
        },
      });

      return { success: true, transactionId: transaction.id, balance: senderWallet.balance };
    } catch (err) {
      console.log({ err })
      await queryRunner.rollbackTransaction();

      // Optionally record failed transaction
      this.kafkaClient.emit('transaction.events', {
        key: fromUserId,
        value: {
          status: 'FAILED',
          fromUserId,
          toUserId,
          amount,
          metadata: { ip, error: err.message, timestamp: new Date().toISOString() },
        },
      });

      throw err instanceof BadRequestException ? err : new InternalServerErrorException(err.message || 'Transaction failed');
    } finally {
      await queryRunner.release();
    }
  }
}
