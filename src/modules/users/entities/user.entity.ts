import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, OneToOne } from 'typeorm';
import { Wallet } from './wallet.entity';

@Entity('users')
@Index(['email', 'isActive']) // Composite Index
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ unique: true })
  email!: string;

  @Column({ select: false })
  password!: string;

  @Column({ default: true })
  isActive!: boolean;

  @OneToOne(() => Wallet, (wallet) => wallet.user)
  wallet!: Wallet;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}