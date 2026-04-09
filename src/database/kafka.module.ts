import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
    imports: [
        ClientsModule.registerAsync([
            {
                name: 'KAFKA_SERVICE', // This is the Injection Token
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (config: ConfigService) => ({
                    transport: Transport.KAFKA,
                    options: {
                        client: {
                            clientId: config.get<string>('KAFKA_CLIENT_ID') || 'fintech-app',
                            brokers: [config.get<string>('KAFKA_BROKER') || 'localhost:9092'],
                            retry: {
                                initialRetryTime: 300,
                                retries: 10
                            }
                        },
                        consumer: {
                            groupId: 'fintech-group', // Needed even for producers in NestJS
                        },
                    },
                }),
            },
        ]),
    ],
    exports: [ClientsModule],
})
export class KafkaCustomModule { }