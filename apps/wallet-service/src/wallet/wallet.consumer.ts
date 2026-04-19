import { Controller } from '@nestjs/common';
import { EventPattern, Payload, Transport } from '@nestjs/microservices';
import { WalletService } from './wallet.service.js';

@Controller()
export class WalletConsumer {
  constructor(private readonly walletService: WalletService) {}

  @EventPattern('user.created', Transport.KAFKA)
  async handleUserCreated(@Payload() data: any) {
    console.log('Received user.created event:', data);
    const { userId } = data;
    if (userId) {
      await this.walletService.createWallet(userId);
      console.log(`Wallet created/verified for user ${userId}`);
    }
  }
}
