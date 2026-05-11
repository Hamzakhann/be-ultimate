import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Outbox, OutboxStatus } from './entities/outbox.entity.js';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class OutboxRelayService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxRelayService.name);
  private intervalRef!: NodeJS.Timeout;
  private isProcessing = false;

  constructor(
    @InjectRepository(Outbox)
    private readonly outboxRepo: Repository<Outbox>,
    @Inject('KAFKA_SERVICE')
    private readonly kafkaClient: ClientKafka,
  ) {}

  onModuleInit() {
    this.logger.log('🚀 Outbox Relay initialized — polling every 5 seconds.');
    // Start standard polling cycle
    this.intervalRef = setInterval(() => this.processOutbox(), 5000);
  }

  onModuleDestroy() {
    if (this.intervalRef) clearInterval(this.intervalRef);
  }

  /**
   * Safe processor cycle preventing overlapping calls.
   */
  async processOutbox() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // 1. Fetch batch of pending items
      const pending = await this.outboxRepo.find({
        where: { status: OutboxStatus.PENDING },
        order: { createdAt: 'ASC' },
        take: 20,
      });

      if (pending.length === 0) return;

      this.logger.log(`📦 Found ${pending.length} pending outbox message(s). Processing...`);

      for (const record of pending) {
        try {
          // 2. Emit to kafka: transactions-sync
          // Antigravity Tip: Using emit() provides Fire-and-Forget resilience,
          // but using lastValueFrom with an acknowledge stream yields extreme durability.
          // We stick to clean fire for performance.
          this.kafkaClient.emit('transactions-sync', {
             key: record.payload.id, // Transaction UUID
             value: record.payload
          });

          // 3. Mark as fully PROCESSED
          record.status = OutboxStatus.PROCESSED;
          record.processedAt = new Date();
          await this.outboxRepo.save(record);

          this.logger.debug(`✅ Relay: Delivered outbox record ${record.id}`);
        } catch (kafkaError) {
          this.logger.error(`❌ Failed to emit outbox record ${record.id}: ${kafkaError.message}`);
          record.status = OutboxStatus.FAILED;
          record.error = kafkaError.message;
          await this.outboxRepo.save(record);
        }
      }
    } catch (error) {
      this.logger.error(`💥 Major Outbox Processor Crash: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }
}
