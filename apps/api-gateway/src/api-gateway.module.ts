import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '@app/common';
import { AuthProxyController, UserProxyController, WalletProxyController } from './proxy.controller';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: join(process.cwd(), 'apps/api-gateway/.env'),
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3001 },
      },
      {
        name: 'USER_SERVICE',
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3003 },
      },
      {
        name: 'WALLET_SERVICE',
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3002 },
      },
    ]),
  ],
  controllers: [AuthProxyController, UserProxyController, WalletProxyController],
  providers: [JwtStrategy],
})
export class ApiGatewayModule {}
