import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { UserProfile } from './entities/user-profile.entity.js';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { UsersGrpcController } from './users.grpc.controller.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { QueryHandlers } from './queries/index.js';

@Module({
    imports: [
        CqrsModule,
        TypeOrmModule.forFeature([UserProfile]),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get<string>('JWT_SECRET'),
                signOptions: {
                    expiresIn: (config.get<string>('JWT_EXPIRES_IN') || '3600s') as any,
                },
            }),
        }),
    ],
    controllers: [UsersController, UsersGrpcController],
    providers: [UsersService, JwtStrategy, ...QueryHandlers],
    exports: [UsersService],
})
export class UsersModule { }
