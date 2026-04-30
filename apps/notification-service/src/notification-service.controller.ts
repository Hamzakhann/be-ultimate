import { Controller, Inject, OnModuleInit, Logger } from '@nestjs/common';
import * as microservices from '@nestjs/microservices';
import { Observable, lastValueFrom } from 'rxjs';

interface UserGrpcService {
  findOne(data: { id: string }): Observable<{ id: string; email: string; isActive: boolean }>;
}

@Controller()
export class NotificationServiceController implements OnModuleInit {
  private readonly logger = new Logger(NotificationServiceController.name);
  private userService: UserGrpcService;

  constructor(@Inject('USER_PACKAGE') private readonly client: microservices.ClientGrpc) {}

  onModuleInit() {
    this.userService = this.client.getService<UserGrpcService>('UserService');
  }

  @microservices.EventPattern('wallet.events')
  async handleWalletEvent(@microservices.Payload() data: any) {
    // Kafka payloads are sometimes wrapped in a 'value' property depending on the client
    const eventData = data.value || data;
    const { status, fromUserId, toUserId, amount, transactionId, metadata } = eventData;
    
    if (status === 'REFUNDED') {
      this.logger.warn(`📬 Refund Notification: Transfer to ${toUserId} failed. $${amount} has been returned to your account. (Reason: ${metadata?.failureReason})`);
      return;
    }

    if (status !== 'SUCCESS') {
      this.logger.warn(`⚠️ Ignoring non-success event for ${transactionId}`);
      return;
    }

    this.logger.log(`🔔 Processing notification for transaction ${transactionId}`);

    try {
      const recipient = await lastValueFrom(this.userService.findOne({ id: toUserId }));
      const email = recipient?.email || 'unknown@example.com';

      this.logger.log(`📧 Notification Sent! To: ${email} | Message: You received $${amount} from User ${fromUserId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send notification: ${error.message}`);
    }
  }
}
