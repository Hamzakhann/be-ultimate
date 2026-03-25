import { Injectable, BadRequestException, InternalServerErrorException, Inject, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { DataSource } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { AuditService } from '../audit/audit.service';
import { TransactionEvent, TransactionStatus } from '../../common/interfaces/transaction-event.interface';

@Injectable()
export class WalletService implements OnModuleInit {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService, // Inject the NoSQL Audit service
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) { }



  async onModuleInit() {
    await this.kafkaClient.connect();
  }

  async createWallet(userId: string): Promise<Wallet> {
    const walletRepository = this.dataSource.getRepository(Wallet);
    const wallet = walletRepository.create({ userId, balance: 0 });
    return await walletRepository.save(wallet);
  }

  async transferFunds(fromUserId: string, toUserId: string, amount: number, ip: string) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Pessimistic Write Lock: Prevents other transactions from reading/writing these rows
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

      // Perform atomic update
      senderWallet.balance = Number(senderWallet.balance) - amount;
      receiverWallet.balance = Number(receiverWallet.balance) + amount;

      await queryRunner.manager.save(senderWallet);
      await queryRunner.manager.save(receiverWallet);

      // 1. Commit SQL Transaction first (Money is safe)
      await queryRunner.commitTransaction();
      // 2. Emit Success Event to Kafka
      this.kafkaClient.emit('transaction.events', {
        key: fromUserId, // Partitioning key
        value: {
          status: TransactionStatus.SUCCESS,
          fromUserId,
          toUserId,
          amount,
          metadata: { ip, timestamp: new Date().toISOString() },
        } as TransactionEvent,
      });
      
      return { success: true, message: 'Transfer completed' };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      // 3. Emit Failure Event to Kafka
      this.kafkaClient.emit('transaction.events', {
        key: fromUserId,
        value: {
          status: TransactionStatus.FAILED,
          fromUserId,
          toUserId,
          amount,
          metadata: { ip, error: err.message, timestamp: new Date().toISOString() },
        } as TransactionEvent,
      });
      throw new InternalServerErrorException(err.message || 'Transaction failed');
    } finally {
      await queryRunner.release();
    }
  }
}