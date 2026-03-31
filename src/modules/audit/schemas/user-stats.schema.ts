import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'user_stats' })
export class UserStats extends Document {
    @Prop({ unique: true, index: true })
    userId: string;

    @Prop({ default: 0 })
    totalTransactions: number;

    @Prop({ default: 0, type: Number })
    totalVolumeUSD: number;

    @Prop()
    lastActivity: Date;
}

export const UserStatsSchema = SchemaFactory.createForClass(UserStats);