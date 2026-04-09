import { Controller, Inject } from '@nestjs/common';
import { EventPattern, Payload, ClientKafka, KafkaContext, Ctx } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditService } from './audit.service';
import { UserStats } from './schemas/user-stats.schema';
import { type TransactionEvent, TransactionStatus } from '../../common/interfaces/transaction-event.interface';

@Controller()
export class AuditConsumer {
    constructor(
        private readonly auditService: AuditService,
        @InjectModel(UserStats.name) private userStatsModel: Model<UserStats>, // Inject the Stats Model
        @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    ) { }

    @EventPattern('transaction.events')
    async handleTransactionEvent(
        @Payload() message: TransactionEvent,
        @Ctx() context: KafkaContext // Inject the Kafka Context to access headers
    ) {
        try {
            const headers = context.getMessage().headers!;
            const correlationId = headers['x-correlation-id']?.toString();
            console.log(`[TRACE: ${correlationId}] Processing event...`);

            // 1. Existing Logic: Save raw audit log
            await this.auditService.log(
                message.fromUserId,
                `TRANSACTION_${message.status}`,
                { ...message.metadata, correlationId },
                message.metadata.ip
            );

            // 2. CQRS Logic: Update "Read Model" (Pre-calculated Stats)
            if (message.status === TransactionStatus.SUCCESS) {
                await this.userStatsModel.updateOne(
                    { userId: message.fromUserId },
                    {
                        $inc: {
                            totalTransactions: 1,
                            totalVolumeUSD: message.amount
                        },
                        $set: { lastActivity: new Date() }
                    },
                    { upsert: true } // Create if doesn't exist
                );
                console.log(`--- READ MODEL UPDATED: Stats for User ${message.fromUserId} materialized ---`);
            }
        } catch (error) {
            // DLQ Logic (From Day 3)
            this.kafkaClient.emit('transaction.events.dlq', { originalMessage: message, error: error.message });
        }
    }
}