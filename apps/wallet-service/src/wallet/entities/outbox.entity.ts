import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

export enum OutboxStatus {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

@Entity('outbox')
export class Outbox {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  type!: string; // e.g., 'transaction.created'

  @Column({ type: 'jsonb' })
  payload!: any;

  @Column({
    type: 'enum',
    enum: OutboxStatus,
    default: OutboxStatus.PENDING,
  })
  @Index()
  status!: OutboxStatus;

  @Column({ nullable: true })
  error?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ nullable: true })
  processedAt?: Date;
}
