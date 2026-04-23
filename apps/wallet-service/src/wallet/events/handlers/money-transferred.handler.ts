import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { MoneyTransferredEvent } from '../impl/money-transferred.event.js';
import { Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@EventsHandler(MoneyTransferredEvent)
export class MoneyTransferredHandler implements IEventHandler<MoneyTransferredEvent> {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  handle(event: MoneyTransferredEvent) {
    const { fromUserId, toUserId, amount, transactionId, ip } = event;

    // Side effect: Emit Kafka event
    this.kafkaClient.emit('transaction.events', {
      key: fromUserId,
      value: {
        status: 'SUCCESS',
        fromUserId,
        toUserId,
        amount,
        transactionId,
        metadata: { ip, timestamp: new Date().toISOString() },
      },
    });
  }
}
