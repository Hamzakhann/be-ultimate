import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { CreditRecipientCommand } from '../impl/credit-recipient.command.js';
import { MoneyTransferredEvent } from '../../events/impl/money-transferred.event.js';
import { CreditFailedEvent } from '../../events/impl/credit-failed.event.js';
import { DataSource } from 'typeorm';
import { Wallet } from '../../entities/wallet.entity.js';
import { Transaction, TransactionStatus } from '../../entities/transaction.entity.js';
import { Logger, Inject, OnModuleInit } from '@nestjs/common';
import * as microservices from '@nestjs/microservices';
import { lastValueFrom, Observable } from 'rxjs';

interface UserGrpcService {
  findOne(data: { id: string }): Observable<{ id: string; email: string; isActive: boolean }>;
}

@CommandHandler(CreditRecipientCommand)
export class CreditRecipientHandler implements ICommandHandler<CreditRecipientCommand>, OnModuleInit {
  private readonly logger = new Logger(CreditRecipientHandler.name);
  private userService: UserGrpcService;

  constructor(
    private readonly dataSource: DataSource,
    private readonly eventBus: EventBus,
    @Inject('USER_PACKAGE') private readonly client: microservices.ClientGrpc,
  ) {}

  onModuleInit() {
    this.userService = this.client.getService<UserGrpcService>('UserService');
  }

  async execute(command: CreditRecipientCommand) {
    const { fromUserId, toUserId, amount, transactionId, ip } = command;

    try {
      // 1. Validate Recipient via gRPC (Now in background!)
      const recipient = await lastValueFrom(this.userService.findOne({ id: toUserId }));
      if (!recipient || !recipient.id) {
        throw new Error('Recipient not found in User Service');
      }
      if (!recipient.isActive) {
        throw new Error('Recipient account is inactive');
      }

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const receiverWallet = await queryRunner.manager.findOne(Wallet, {
          where: { userId: toUserId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!receiverWallet) {
          throw new Error('Recipient wallet not found');
        }

        // Update balance
        receiverWallet.balance = Number(receiverWallet.balance) + amount;
        await queryRunner.manager.save(receiverWallet);

        // Update transaction status
        await queryRunner.manager.update(Transaction, transactionId, {
          status: TransactionStatus.SUCCESS,
        } as any);

        await queryRunner.commitTransaction();
        this.logger.log(`Successfully credited $${amount} to User ${toUserId}`);

        // Final Success Event
        this.eventBus.publish(
          new MoneyTransferredEvent(fromUserId, toUserId, amount, transactionId, ip),
        );
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error(`❌ Saga Stage 2 Failed: ${error.message}`);
      
      // Trigger Saga's failure path (Refund)
      this.eventBus.publish(
        new CreditFailedEvent(fromUserId, toUserId, amount, transactionId, error.message),
      );
    }
  }
}
