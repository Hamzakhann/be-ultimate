import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class WalletService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService, // Inject the NoSQL Audit service
  ) {}

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

      // LOG TO MONGO: This keeps Postgres clean of high-volume log data
      await this.auditService.log(
        fromUserId, 
        'FUNDS_TRANSFER_INITIATED', 
        { toUserId, amount }, 
        ip
      );

      await queryRunner.commitTransaction();
      return { success: true, message: 'Transfer completed' };
    } catch (err) {
      await this.auditService.log(fromUserId, 'FUNDS_TRANSFER_FAILED', { error: err.message }, ip);
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(err.message || 'Transaction failed');
    } finally {
      await queryRunner.release();
    }
  }
}