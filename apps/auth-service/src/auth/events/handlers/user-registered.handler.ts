import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserRegisteredEvent } from '../impl/user-registered.event.js';
import { Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@EventsHandler(UserRegisteredEvent)
export class UserRegisteredHandler implements IEventHandler<UserRegisteredEvent> {
  constructor(
    @Inject('AUTH_KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
  ) {}

  handle(event: UserRegisteredEvent) {
    const { userId, email } = event;

    // Side effect: Emit Kafka event
    this.kafkaClient.emit('user.created', {
      userId,
      email,
    });
  }
}
