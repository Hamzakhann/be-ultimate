import { Controller, Get, Param, Query, Logger } from '@nestjs/common';
import { EventPattern, Payload, Transport } from '@nestjs/microservices';
import { AuditServiceService } from './audit-service.service.js';

import { SearchService } from '@app/search';

@Controller('audit')
export class AuditServiceController {
  private readonly logger = new Logger(AuditServiceController.name);

  constructor(
    private readonly auditService: AuditServiceService,
    private readonly searchService: SearchService,
  ) {}

  @Get('logs/:userId')
  async getLogs(@Param('userId') userId: string, @Query('limit') limit?: string) {
    return this.auditService.getLogs(userId, limit ? parseInt(limit) : 50);
  }

  @Get('stats/:userId')
  async getStats(@Param('userId') userId: string) {
    return this.auditService.getStats(userId);
  }

  @EventPattern('wallet.events', Transport.KAFKA)
  async handleWalletEvent(@Payload() data: any) {
    const event = data.value || data;
    const { status, fromUserId, toUserId, amount, transactionId, metadata } = event;

    this.logger.log(`Received wallet event: ${status} for transaction ${transactionId}`);

    if (status === 'SUCCESS') {
      // Log for sender
      await this.auditService.createLog({
        userId: fromUserId,
        action: 'MONEY_SENT',
        ipAddress: metadata?.ip,
        metadata: { toUserId, amount, transactionId },
        messageId: transactionId,
      });

      // Log for receiver
      await this.auditService.createLog({
        userId: toUserId,
        action: 'MONEY_RECEIVED',
        metadata: { fromUserId, amount, transactionId },
      });

      // Update stats for both
      await this.auditService.updateStats(fromUserId, amount);
      await this.auditService.updateStats(toUserId, amount);
    }
  }

  @EventPattern('user.events', Transport.KAFKA)
  async handleUserEvent(@Payload() data: any) {
    const event = data.value || data;
    const { type, userId, metadata } = event;

    this.logger.log(`Received user event: ${type} for user ${userId}`);

    await this.auditService.createLog({
      userId,
      action: type,
      ipAddress: metadata?.ip,
      metadata,
    });
  }

  // ─── Real-Time Synchronization to Elasticsearch ──────────────────────────

  @EventPattern('transactions-sync', Transport.KAFKA)
  async syncTransactionToSearch(@Payload() data: any) {
    const event = data.value || data;
    
    // Extract original payload from the Kafka payload structure
    // event represents our Transaction record as captured in outbox
    const { id, fromUserId, toUserId, amount, type, status, metadata, createdAt } = event;

    this.logger.log(`🔄 Syncing Transaction [${id}] to Elasticsearch via Outbox Stream.`);

    try {
      await this.searchService.indexTransaction({
        id,
        sender_id:   fromUserId,
        receiver_id: toUserId,
        amount:      typeof amount === 'string' ? parseFloat(amount) : amount,
        currency:    'USD', // Default
        status:      status,
        event_type:  type,
        description: `Money Transfer: ${fromUserId} -> ${toUserId} [${type}]`,
        timestamp:   createdAt || new Date().toISOString(),
      });
      this.logger.log(`✅ Successfully synced Transaction [${id}] to Search Engine.`);
    } catch (error) {
      this.logger.error(`❌ CRITICAL: Failed to index transaction ${id} to Elastic: ${error.message}`);
    }
  }
}
