import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service.js';
import { JwtAuthGuard } from '@app/common/guards/jwt-auth.guard.js';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @UseGuards(JwtAuthGuard)
  @Get('balance')
  async getBalance(@Req() req: any) {
    const userId = req.user.userId;
    const balance = await this.walletService.getBalance(userId);
    return { userId, balance };
  }

  @UseGuards(JwtAuthGuard)
  @Post('transfer')
  async transfer(
    @Req() req: any,
    @Body() body: { toUserId: string; amount: number },
  ) {
    const fromUserId = req.user.userId;
    const ip = req.ip;
    return await this.walletService.transferFunds(
      fromUserId,
      body.toUserId,
      body.amount,
      ip,
    );
  }
}
