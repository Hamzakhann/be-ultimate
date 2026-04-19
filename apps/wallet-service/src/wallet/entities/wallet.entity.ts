import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn, Index, CreateDateColumn } from 'typeorm';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance!: number;

  @Column({ default: 'USD' })
  currency!: string;

  @Column()
  @Index({ unique: true }) // userId should be unique in the wallet table
  userId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
