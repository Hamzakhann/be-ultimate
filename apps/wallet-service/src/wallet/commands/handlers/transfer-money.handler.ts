import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { TransferMoneyCommand } from '../impl/transfer-money.command.js';
import { MoneyTransferredEvent } from '../../events/impl/money-transferred.event.js';
import { DataSource } from 'typeorm';
import { Wallet } from '../../entities/wallet.entity.js';
import { Transaction, TransactionStatus, TransactionType } from '../../entities/transaction.entity.js';
import { BadRequestException, NotFoundException, InternalServerErrorException, Inject, OnModuleInit } from '@nestjs/common';
import * as microservices from '@nestjs/microservices';
import { lastValueFrom, Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

interface UserGrpcService {
  findOne(data: { id: string }): Observable<{ id: string; email: string; isActive: boolean }>;
}

@CommandHandler(TransferMoneyCommand)
export class TransferMoneyHandler implements ICommandHandler<TransferMoneyCommand>, OnModuleInit {
  private userService: UserGrpcService;

  constructor(
    private readonly dataSource: DataSource,
    private readonly eventBus: EventBus,
    @Inject('USER_PACKAGE') private readonly client: microservices.ClientGrpc,
  ) {}

  onModuleInit() {
    this.userService = this.client.getService<UserGrpcService>('UserService');
  }

  async execute(command: TransferMoneyCommand) {
    const { fromUserId, toUserId, amount, ip } = command;
    const correlationId = uuidv4();

    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    if (fromUserId === toUserId) throw new BadRequestException('Cannot transfer to self');

    // 1. gRPC Recipient Check
    try {
      const recipient = await lastValueFrom(this.userService.findOne({ id: toUserId }));
      if (!recipient || !recipient.id) {
        throw new NotFoundException('Recipient not found in User Service');
      }
      if (!recipient.isActive) {
        throw new BadRequestException('Recipient account is inactive');
      }
    } catch (error) {
      console.error('[TransferMoneyHandler] gRPC Validation Error:', error);
      if (error.constructor.name === 'NotFoundException' || error.constructor.name === 'BadRequestException' || error.status === 404 || error.status === 400) throw error;
      throw new InternalServerErrorException('Failed to validate recipient via gRPC: ' + error.message);
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

      // 2. Update Balances
      senderWallet.balance = Number(senderWallet.balance) - amount;
      receiverWallet.balance = Number(receiverWallet.balance) + amount;

      await queryRunner.manager.save(senderWallet);
      await queryRunner.manager.save(receiverWallet);

      // 3. Record Transaction
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

      // 4. Publish Event
      this.eventBus.publish(
        new MoneyTransferredEvent(fromUserId, toUserId, amount, transaction.id, ip),
      );

      return { success: true, transactionId: transaction.id, balance: senderWallet.balance };
    } catch (err) {
      console.error('[TransferMoneyHandler] Transaction Logic Error:', err);
      await queryRunner.rollbackTransaction();
      throw err instanceof BadRequestException ? err : new InternalServerErrorException(err.message || 'Transaction failed');
    } finally {
      await queryRunner.release();
    }
  }
}