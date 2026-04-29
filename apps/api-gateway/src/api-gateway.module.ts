import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy, DiscoveryModule, DiscoveryService } from '@app/common';
import { AuthProxyController, UserProxyController, WalletProxyController } from './proxy.controller';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: join(process.cwd(), 'apps/api-gateway/.env'),
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    DiscoveryModule,
    ClientsModule.registerAsync([
      {
        name: 'AUTH_SERVICE',
        imports: [DiscoveryModule],
        inject: [DiscoveryService],
        useFactory: async (discoveryService: DiscoveryService) => {
          try {
            const { address, port } = await discoveryService.discoverService('auth-service');
            console.log(`[Gateway] Resolved auth-service at ${address}:${port}`);
            return {
              transport: Transport.TCP,
              options: { host: address, port },
            };
          } catch (e) {
            console.error('[Gateway] Failed to discover auth-service:', e.message);
            throw e;
          }
        },
      },
      {
        name: 'USER_SERVICE',
        imports: [DiscoveryModule],
        inject: [DiscoveryService],
        useFactory: async (discoveryService: DiscoveryService) => {
          try {
            const { address, port } = await discoveryService.discoverService('user-service');
            console.log(`[Gateway] Resolved user-service at ${address}:${port}`);
            return {
              transport: Transport.TCP,
              options: { host: address, port },
            };
          } catch (e) {
            console.error('[Gateway] Failed to discover user-service:', e.message);
            throw e;
          }
        },
      },
      {
        name: 'WALLET_SERVICE',
        imports: [DiscoveryModule],
        inject: [DiscoveryService],
        useFactory: async (discoveryService: DiscoveryService) => {
          try {
            const { address, port } = await discoveryService.discoverService('wallet-service');
            console.log(`[Gateway] Resolved wallet-service at ${address}:${port}`);
            return {
              transport: Transport.TCP,
              options: { host: address, port },
            };
          } catch (e) {
            console.error('[Gateway] Failed to discover wallet-service:', e.message);
            throw e;
          }
        },
      },
    ]),
  ],
  controllers: [AuthProxyController, UserProxyController, WalletProxyController],
  providers: [JwtStrategy],
})
export class ApiGatewayModule {}
