import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity.js';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance!: number;

  @Column({ default: 'USD' })
  currency!: string;

  @OneToOne(() => User, (user) => user.wallet)
  @JoinColumn({ name: 'userId' })
  @Index()
  user!: User;

  @Column()
  userId!: string;

  @UpdateDateColumn()
  updatedAt!: Date;
}
