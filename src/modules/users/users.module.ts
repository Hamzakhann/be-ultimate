import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { AuditModule } from '../audit/audit.module';
import { StatementProcessor } from './workers/statement.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'statement-generation',
    }),
    TypeOrmModule.forFeature([User]),
    AuditModule
  ],
  controllers: [UsersController],
  providers: [UsersService, StatementProcessor],
  exports: [UsersService],
})
export class UsersModule { }