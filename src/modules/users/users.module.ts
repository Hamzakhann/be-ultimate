import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Wallet } from './entities/wallet.entity';
import { WalletService } from './wallet.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Wallet]),
    AuditModule
  ],
  controllers: [UsersController],
  providers: [UsersService, WalletService],
  exports: [UsersService, WalletService],
})
export class UsersModule { }