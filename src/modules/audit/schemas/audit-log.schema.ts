import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'audit_logs' })
export class AuditLog extends Document {
    @Prop({ required: true, index: true })
    userId: string;

    @Prop({ required: true })
    action: string; // e.g., 'LOGIN', 'TRANSFER_FUNDS'

    @Prop({ type: Object })
    metadata: Record<string, any>; // Flexible data for different actions

    @Prop()
    ipAddress: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);