import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog } from './schemas/audit-log.schema';

@Injectable()
export class AuditService {
    constructor(
        @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLog>
    ) { }

    async log(userId: string, action: string, metadata: Record<string, any>, ip: string): Promise<void> {
        const newLog = new this.auditLogModel({
            userId,
            action,
            metadata,
            ipAddress: ip,
        });
        await newLog.save();
    }
}