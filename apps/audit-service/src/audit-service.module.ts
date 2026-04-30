import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TerminusModule } from '@nestjs/terminus';
import { DiscoveryModule } from '@app/common';
import { AuditServiceController } from './audit-service.controller.js';
import { AuditServiceService } from './audit-service.service.js';
import { HealthController } from './health.controller.js';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema.js';
import { UserStats, UserStatsSchema } from './schemas/user-stats.schema.js';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(process.cwd(), 'apps/audit-service/.env'),
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI'),
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 10000,
        family: 4, // Force IPv4 to prevent local connection issues
        connectionFactory: (connection) => {
          connection.on('connected', () => console.log('✅ Audit Service connected to MongoDB Replica Set'));
          connection.on('error', (err) => console.error('❌ MongoDB Connection Error:', err));
          return connection;
        },
      }),
    }),
    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: UserStats.name, schema: UserStatsSchema },
    ]),
    DiscoveryModule,
    TerminusModule,
  ],
  controllers: [HealthController, AuditServiceController],
  providers: [AuditServiceService],
})
export class AuditServiceModule {}
