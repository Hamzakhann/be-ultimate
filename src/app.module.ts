import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './modules/users/entities/user.entity';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    // Database Configuration
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'admin',
      password: 'password123',
      database: 'fintech_platform',
      entities: [User],
      synchronize: true, // Note: Set to false in production; use migrations instead!
    }),
    UsersModule,
  ],
})
export class AppModule { }