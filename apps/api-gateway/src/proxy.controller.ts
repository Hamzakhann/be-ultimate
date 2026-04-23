import { Controller, Post, Get, Patch, Body, Inject, UseGuards, Req, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { JwtAuthGuard } from '@app/common';
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
  getMe(@CurrentUser() user: any) {
    return this.userClient.send({ cmd: 'get_profile' }, { userId: user.userId });
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(@CurrentUser() user: any, @Body() dto: any) {
    return this.userClient.send({ cmd: 'update_profile' }, { userId: user.userId, dto });
  }
}

@Controller('wallet')
export class WalletProxyController {
  constructor(@Inject('WALLET_SERVICE') private walletClient: ClientProxy) { }

  @UseGuards(JwtAuthGuard)
  @Get('balance')
  getBalance(@CurrentUser() user: any) {
    return this.walletClient.send({ cmd: 'get_balance' }, { userId: user.userId });
  }

  @UseGuards(JwtAuthGuard)
  @Post('transfer')
  transfer(@CurrentUser() user: any, @Body() dto: any, @Req() req: any) {
    return this.walletClient.send({ cmd: 'transfer' }, {
      userId: user.userId,
      dto,
      ip: req.ip
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  getHistory(
    @CurrentUser() user: any,
    @Query('limit') limit: number,
    @Query('offset') offset: number,
  ) {
    return this.walletClient.send(
      { cmd: 'get_history' },
      { userId: user.userId, limit, offset },
    );
  }
}
