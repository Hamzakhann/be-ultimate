import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema';
import { AuditService } from './audit.service';
import { AuditConsumer } from './audit.controller';

@Global() // Make it global so we can log from anywhere
@Module({
    imports: [
        MongooseModule.forFeature([{ name: AuditLog.name, schema: AuditLogSchema }]),
    ],
    providers: [AuditService],
    controllers: [AuditConsumer], // Register the consumer as a controller
    exports: [AuditService],
})
export class AuditModule { }