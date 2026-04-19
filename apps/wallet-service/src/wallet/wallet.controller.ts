import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload, Transport } from '@nestjs/microservices';
import { WalletService } from './wallet.service.js';
import { JwtAuthGuard } from '@app/common/guards/jwt-auth.guard.js';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @MessagePattern({ cmd: 'get_balance' }, Transport.TCP)
  @Get('balance')
  async getBalance(@Req() req: any, @Payload() data?: any) {
    const userId = req?.user?.userId || data?.userId;
    const balance = await this.walletService.getBalance(userId);
    return { userId, balance };
  }

  @MessagePattern({ cmd: 'transfer' }, Transport.TCP)
  @Post('transfer')
  async transfer(
    @Req() req: any,
    @Body() body: { toUserId: string; amount: number },
    @Payload() data?: any,
  ) {
    const fromUserId = req?.user?.userId || data?.userId;
    const toUserId = data?.dto?.toUserId || body?.toUserId;
    const amount = data?.dto?.amount || body?.amount;
    const ip = req?.ip || data?.ip || '0.0.0.0';

    return await this.walletService.transferFunds(
      fromUserId,
      toUserId,
      amount,
      ip,
    );
  }
}
