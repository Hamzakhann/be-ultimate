import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ 
  timestamps: true, 
  collection: 'audit_logs',
  // Senior Tip: size is in bytes (1024 * 1024 * 1024 = 1GB), max is document count
  capped: { size: 1073741824, max: 1000000 } 
})
export class AuditLog extends Document {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  action: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop()
  ipAddress: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);