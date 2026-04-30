import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { MoneyRefundedEvent } from '../impl/money-refunded.event.js';
import { Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@EventsHandler(MoneyRefundedEvent)
export class MoneyRefundedHandler implements IEventHandler<MoneyRefundedEvent> {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  handle(event: MoneyRefundedEvent) {
    const { fromUserId, toUserId, amount, transactionId, reason } = event;

    this.kafkaClient.emit('wallet.events', {
      key: fromUserId,
      value: {
        status: 'REFUNDED',
        fromUserId,
        toUserId,
        amount,
        transactionId,
        metadata: { failureReason: reason, timestamp: new Date().toISOString() },
      },
    });
  }
}
