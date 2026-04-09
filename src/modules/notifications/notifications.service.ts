import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    async sendTransferEmail(toEmail: string, amount: number, traceId: string) {
        // In Week 5 we will integrate an actual Email Provider (SendGrid/SES)
        // For now, we simulate the "heavy" async task
        this.logger.log(`[TRACE: ${traceId}] SENDING EMAIL to ${toEmail}: You received $${amount}!`);
    }
}