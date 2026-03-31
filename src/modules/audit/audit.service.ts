import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog } from './schemas/audit-log.schema';
import { UserStats } from './schemas/user-stats.schema';

@Injectable()
export class AuditService {
    constructor(
        @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLog>,
        @InjectModel(UserStats.name) private userStatsModel: Model<UserStats>, // Inject here
    ) { }

    // WRITE: Always goes to Primary node
    async log(userId: string, action: string, metadata: Record<string, any>, ip: string): Promise<void> {
        const newLog = new this.auditLogModel({ userId, action, metadata, ipAddress: ip });
        await newLog.save();
    }

    // READ: Industry Standard - Read from Secondaries to scale performance
    async getLogsByUser(userId: string) {
        return this.auditLogModel
            .find({ userId })
            .read('secondaryPreferred') // Senior Best Practice
            .sort({ createdAt: -1 })
            .limit(100)
            .exec();
    }


    // NEW: The "Query" side of CQRS
    async getUserStats(userId: string) {
        console.log(userId);
        const stats = await this.userStatsModel.findOne({ userId }).exec();
        if (!stats) {
            return {
                userId,
                totalTransactions: 0,
                totalVolumeUSD: 0,
                message: "No activity recorded yet."
            };
        }
        return stats;
    }
}