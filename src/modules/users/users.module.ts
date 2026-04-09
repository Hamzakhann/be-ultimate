import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq'; // Import this
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Wallet } from './entities/wallet.entity';
import { WalletService } from './wallet.service';
import { AuditModule } from '../audit/audit.module';
import { StatementProcessor } from './workers/statement.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'statement-generation',
    }),
    TypeOrmModule.forFeature([User, Wallet]),
    AuditModule
  ],
  controllers: [UsersController],
  providers: [UsersService, WalletService, StatementProcessor],
  exports: [UsersService, WalletService],
})
export class UsersModule { }