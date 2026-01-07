import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
    imports: [TypeOrmModule.forFeature([User])], // Makes UserRepository available
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService], // Export so AuthModule can use it later
})
export class UsersModule { }