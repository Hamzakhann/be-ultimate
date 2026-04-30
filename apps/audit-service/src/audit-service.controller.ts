import { Controller, Get, Param, Query, Logger } from '@nestjs/common';
import { EventPattern, Payload, Transport } from '@nestjs/microservices';
import { AuditServiceService } from './audit-service.service.js';

@Controller('audit')
export class AuditServiceController {
  private readonly logger = new Logger(AuditServiceController.name);

  constructor(private readonly auditService: AuditServiceService) {}

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
}
