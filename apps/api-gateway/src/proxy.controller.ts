import { Controller, Post, Get, Patch, Body, Inject, UseGuards, Req, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { JwtAuthGuard } from '@app/common';
import type { UserPayload, UserProfile } from '@app/common';
import { CurrentUser } from '@app/common';

@Controller('auth')
export class AuthProxyController {
  constructor(@Inject('AUTH_SERVICE') private authClient: ClientProxy) { }

  @Post('register')
  register(@Body() dto: any) {
    return this.authClient.send({ cmd: 'register' }, dto);
  }

  @Post('login')
  login(@Body() dto: any) {
    return this.authClient.send({ cmd: 'login' }, dto);
  }
}

@Controller('users')
export class UserProxyController {
  constructor(@Inject('USER_SERVICE') private userClient: ClientProxy) { }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: UserPayload) {
    return this.userClient.send({ cmd: 'get_profile' }, { userId: user.userId });
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(@CurrentUser() user: UserPayload, @Body() dto: any) {
    return this.userClient.send({ cmd: 'update_profile' }, { userId: user.userId, dto });
  }

  @UseGuards(JwtAuthGuard)
  @Get('search')
  searchByEmail(@Query('email') email: string) {
    return this.userClient.send({ cmd: 'search_by_email' }, { email });
  }
}

@Controller('wallet')
export class WalletProxyController {
  constructor(
    @Inject('WALLET_SERVICE') private walletClient: ClientProxy,
    @Inject('USER_SERVICE') private userClient: ClientProxy,
  ) { }

  @UseGuards(JwtAuthGuard)
  @Get('balance')
  async getBalance(@CurrentUser() user: UserPayload) {
    const balance = await this.walletClient.send({ cmd: 'get_balance' }, { userId: user.userId }).toPromise();
    return { balance };
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  getStats(@CurrentUser() user: UserPayload) {
    return this.walletClient.send({ cmd: 'get_stats' }, { userId: user.userId });
  }

  @UseGuards(JwtAuthGuard)
  @Post('transfer')
  async transfer(@CurrentUser() user: UserPayload, @Body() dto: any, @Req() req: any) {
    console.log('[Gateway Proxy] Incoming Transfer Request:', { userId: user?.userId, dto });
    try {
      const result = await this.walletClient.send({ cmd: 'transfer' }, {
        userId: user.userId,
        dto,
        ip: req.ip
      }).toPromise();
      console.log('[Gateway Proxy] Transfer Success Result:', result);
      return result;
    } catch (error) {
      console.error('[Gateway Proxy] Transfer Error:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  async getHistory(
    @CurrentUser() user: UserPayload,
    @Query('limit') limit: number,
    @Query('offset') offset: number,
  ) {
    // 1. Fetch raw transactions from Wallet Service
    const historyResult: { transactions: any[], total: number } = await this.walletClient.send(
      { cmd: 'get_history' },
      { userId: user.userId, limit, offset },
    ).toPromise();

    if (!historyResult || !historyResult.transactions) return historyResult;

    // 2. Cache for profiles to avoid redundant network calls
    const profileCache = new Map<string, any>();

    // 3. Process and enrich each transaction
    const enrichedTransactions = await Promise.all(historyResult.transactions.map(async (tx: any) => {
      // Determine direction relative to the requesting user
      const isOutbound = tx.fromUserId === user.userId;
      const direction = isOutbound ? 'OUTBOUND' : 'INBOUND';
      
      // Identify the counterparty (who the money went to or came from)
      const counterpartyId = isOutbound ? tx.toUserId : tx.fromUserId;
      
      let counterpartyProfile: Partial<UserProfile> | null = null;

      if (counterpartyId === 'SYSTEM') {
         counterpartyProfile = { firstName: 'System', lastName: 'Deposit', avatarUrl: null };
      } else if (counterpartyId) {
        // Fetch from cache or user-service
        if (!profileCache.has(counterpartyId)) {
          try {
            const profile = await this.userClient.send({ cmd: 'get_profile' }, { userId: counterpartyId }).toPromise();
            profileCache.set(counterpartyId, profile);
          } catch (err) {
            profileCache.set(counterpartyId, { firstName: 'Unknown', lastName: 'User' });
          }
        }
        counterpartyProfile = profileCache.get(counterpartyId);
      }

      return {
        ...tx,
        direction,
        counterparty: counterpartyProfile,
      };
    }));

    return {
      total: historyResult.total,
      transactions: enrichedTransactions,
    };
  }
}
