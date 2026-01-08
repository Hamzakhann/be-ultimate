import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from './user.entity';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Precision 15, Scale 2 allows up to 999,999,999,999.99
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance!: number;

  @Column({ default: 'USD' })
  currency!: string;

  @OneToOne(() => User, (user) => user.wallet)
  @JoinColumn({ name: 'userId' })
  @Index() // Index for fast lookup by userId
  user!: User;

  @Column()
  userId!: string;

  @UpdateDateColumn()
  updatedAt!: Date;
  
}