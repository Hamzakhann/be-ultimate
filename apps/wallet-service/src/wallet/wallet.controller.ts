import { Controller, Get, Post, Body, Req, Query, BadRequestException } from '@nestjs/common';
import { MessagePattern, Payload, Transport } from '@nestjs/microservices';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { WalletService } from './wallet.service.js';
import { TransferMoneyCommand } from './commands/impl/transfer-money.command.js';
import { GetBalanceQuery } from './queries/impl/get-balance.query.js';
import { GetTransactionHistoryQuery } from './queries/impl/get-transaction-history.query.js';

@Controller('wallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @MessagePattern({ cmd: 'get_balance' }, Transport.TCP)
  @Get('balance')
  async getBalance(@Req() req: any, @Payload() data?: any) {
    const userId = req?.user?.userId || data?.userId;
    return this.queryBus.execute(new GetBalanceQuery(userId));
  }

  @MessagePattern({ cmd: 'get_history' }, Transport.TCP)
  @Get('history')
  async getHistory(
    @Req() req: any,
    @Query('limit') limit: number,
    @Query('offset') offset: number,
    @Payload() data?: any,
  ) {
    const userId = req?.user?.userId || data?.userId;
    const l = data?.limit || limit || 10;
    const o = data?.offset || offset || 0;
    return this.queryBus.execute(new GetTransactionHistoryQuery(userId, l, o));
  }

  @MessagePattern({ cmd: 'transfer' }, Transport.TCP)
  @Post('transfer')
  async transfer(
    @Req() req: any,
    @Body() body: any,
    @Payload() data?: any,
  ) {
    // Extracting data from either HTTP (req/body) or TCP (data)
    const fromUserId = req?.user?.userId || data?.userId;
    const toUserId = data?.dto?.toUserId || body?.toUserId;
    const amount = data?.dto?.amount || body?.amount;
    const ip = req?.ip || data?.ip || '0.0.0.0';

    console.log('[Wallet Service] Received Transfer Request:', { 
      from: fromUserId, 
      to: toUserId, 
      amount, 
      transport: req ? 'HTTP' : 'TCP' 
    });

    if (!fromUserId || !toUserId || !amount) {
      console.error('[Wallet Service] Missing required fields:', { fromUserId, toUserId, amount });
      throw new BadRequestException('Missing fromUserId, toUserId, or amount');
    }

    try {
      const result = await this.commandBus.execute(
        new TransferMoneyCommand(fromUserId, toUserId, Number(amount), ip),
      );
      console.log('[Wallet Service] Transfer Success:', result);
      return result;
    } catch (error) {
      console.error('[Wallet Service] Transfer Command Error:', error);
      throw error;
    }
  }
}
