import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { RefundSenderCommand } from '../impl/refund-sender.command.js';
import { DataSource } from 'typeorm';
import { Wallet } from '../../entities/wallet.entity.js';
import { Transaction, TransactionStatus } from '../../entities/transaction.entity.js';
import { Logger } from '@nestjs/common';
import { MoneyRefundedEvent } from '../../events/impl/money-refunded.event.js';

@CommandHandler(RefundSenderCommand)
export class RefundSenderHandler implements ICommandHandler<RefundSenderCommand> {
  private readonly logger = new Logger(RefundSenderHandler.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RefundSenderCommand) {
    const { fromUserId, amount, transactionId, reason } = command;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const senderWallet = await queryRunner.manager.findOne(Wallet, {
        where: { userId: fromUserId },
        lock: { mode: 'pessimistic_write' },
      });

      if (senderWallet) {
        senderWallet.balance = Number(senderWallet.balance) + amount;
        await queryRunner.manager.save(senderWallet);
      }

      // Mark transaction as failed
      await queryRunner.manager.update(Transaction, transactionId, {
        status: TransactionStatus.FAILED,
        metadata: { failureReason: reason },
      } as any);

      await queryRunner.commitTransaction();
      this.logger.warn(`Refunded $${amount} to User ${fromUserId} due to: ${reason}`);

      // Publish Refund Event for Notifications
      this.eventBus.publish(
        new MoneyRefundedEvent(fromUserId, '', amount, transactionId, reason),
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Critical Failure: Could not refund User ${fromUserId}: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }
}
