import { Controller, Inject } from '@nestjs/common';
import { EventPattern, Payload, Ctx, KafkaContext, ClientKafka } from '@nestjs/microservices';
import { NotificationsService } from './notifications.service';
import { type TransactionEvent, TransactionStatus } from '../../common/interfaces/transaction-event.interface';

@Controller()
export class NotificationsController {
    constructor(
        private readonly notificationsService: NotificationsService,
        @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka, // For DLQ support
    ) { }

    @EventPattern('transaction.events')
    async handleNotification(
        @Payload() message: TransactionEvent,
        @Ctx() context: KafkaContext
    ) {
        const headers = context.getMessage().headers!;
        const correlationId = headers['x-correlation-id']?.toString();

        try {
            if (message.status === TransactionStatus.SUCCESS) {
                console.log(`[TRACE: ${correlationId}] Triggering Notification flow...`);

                const mockEmail = `user_${message.toUserId}@example.com`;
                await this.notificationsService.sendTransferEmail(
                    mockEmail,
                    message.amount,
                    correlationId!
                );
            }
        } catch (error) {
            console.error(`[TRACE: ${correlationId}] Notification Error: ${error.message}`);
            // Move to DLQ specifically for notification failures
            this.kafkaClient.emit('notifications.events.dlq', {
                originalMessage: message,
                error: error.message,
                traceId: correlationId
            });
        }
    }
}