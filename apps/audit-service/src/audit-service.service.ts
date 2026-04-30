import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog } from './schemas/audit-log.schema.js';
import { UserStats } from './schemas/user-stats.schema.js';

@Injectable()
export class AuditServiceService {
  private readonly logger = new Logger(AuditServiceService.name);

  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLog>,
    @InjectModel(UserStats.name) private userStatsModel: Model<UserStats>,
  ) {}

  async createLog(data: Partial<AuditLog>): Promise<AuditLog> {
    this.logger.log(`Creating audit log for user ${data.userId}: ${data.action}`);
    const log = new this.auditLogModel(data);
    return log.save();
  }

  async updateStats(userId: string, amount: number): Promise<void> {
    this.logger.log(`Updating stats for user ${userId}: +$${amount}`);
    await this.userStatsModel.findOneAndUpdate(
      { userId },
      {
        $inc: {
          totalTransactions: 1,
          totalVolumeUSD: amount,
        },
        $set: { lastActivity: new Date() },
      },
      { upsert: true, new: true },
    );
  }

  async getLogs(userId: string, limit = 50) {
    return this.auditLogModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async getStats(userId: string) {
    return this.userStatsModel.findOne({ userId }).exec();
  }
}
