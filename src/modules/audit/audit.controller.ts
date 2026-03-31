import { Controller, Inject } from '@nestjs/common';
import { EventPattern, Payload, ClientKafka } from '@nestjs/microservices';
import { AuditService } from './audit.service';
import { type TransactionEvent } from '../../common/interfaces/transaction-event.interface';

@Controller()
export class AuditConsumer {
    constructor(
        private readonly auditService: AuditService,
        @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka, // Inject for DLQ
    ) { }

    @EventPattern('transaction.events')
    async handleTransactionEvent(@Payload() message: TransactionEvent) {
        try {
            // Logic to save to MongoDB
            await this.auditService.log(
                message.fromUserId,
                `TRANSACTION_${message.status}`,
                message.metadata,
                message.metadata.ip
            );
        } catch (error) {
            console.error(`--- ERROR PROCESSING MESSAGE: ${error.message} ---`);

            // Senior Logic: If it's a permanent error, move to DLQ
            // In a real app, you might check 'attempts' count
            this.kafkaClient.emit('transaction.events.dlq', {
                originalMessage: message,
                error: error.message,
                failedAt: new Date().toISOString(),
            });

            console.log('--- MESSAGE MOVED TO DLQ ---');
        }
    }
}