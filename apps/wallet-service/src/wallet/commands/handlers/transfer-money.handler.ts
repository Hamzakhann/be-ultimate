import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { TransferMoneyCommand } from '../impl/transfer-money.command.js';
import { MoneyTransferredEvent } from '../../events/impl/money-transferred.event.js';
import { MoneyDeductedEvent } from '../../events/impl/money-deducted.event.js';
import { DataSource } from 'typeorm';
import { Wallet } from '../../entities/wallet.entity.js';
import { Transaction, TransactionStatus, TransactionType } from '../../entities/transaction.entity.js';
import { BadRequestException, NotFoundException, InternalServerErrorException, Inject, OnModuleInit } from '@nestjs/common';
import * as microservices from '@nestjs/microservices';
import { lastValueFrom, Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

@CommandHandler(TransferMoneyCommand)
export class TransferMoneyHandler implements ICommandHandler<TransferMoneyCommand> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: TransferMoneyCommand) {
    const { fromUserId, toUserId, amount, ip } = command;
    const correlationId = uuidv4();

    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    if (fromUserId === toUserId) throw new BadRequestException('Cannot transfer to self');

    // 1. gRPC Recipient Check
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const senderWallet = await queryRunner.manager.findOne(Wallet, {
        where: { userId: fromUserId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!senderWallet) {
        throw new BadRequestException('Sender wallet not found');
      }

      if (Number(senderWallet.balance) < amount) {
        throw new BadRequestException('Insufficient funds');
      }

      // 2. Update Sender Balance (Only)
      senderWallet.balance = Number(senderWallet.balance) - amount;
      await queryRunner.manager.save(senderWallet);

      // 3. Record Transaction (PENDING)
      const transaction = queryRunner.manager.create(Transaction, {
        fromUserId,
        toUserId,
        amount,
        type: TransactionType.TRANSFER,
        status: TransactionStatus.PENDING,
        metadata: { ip, correlationId, timestamp: new Date().toISOString() },
      });
      await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();

      // 4. Publish Deduction Event (Triggers Saga)
      this.eventBus.publish(
        new MoneyDeductedEvent(fromUserId, toUserId, amount, transaction.id, ip),
      );

      return { 
        success: true, 
        message: 'Transfer initiated and is being processed',
        transactionId: transaction.id, 
        balance: senderWallet.balance 
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error('[TransferMoneyHandler] Transaction Logic Error:', err);
      throw err instanceof BadRequestException || err instanceof NotFoundException ? err : new InternalServerErrorException(err.message || 'Transaction failed');
    } finally {
      await queryRunner.release();
    }
  }
}