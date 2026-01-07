import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid') // UUID is better for distributed systems than Incremental IDs
    id: string;

    @Index({ unique: true }) // Fast lookup for logins
    @Column({ unique: true })
    email: string;

    @Column({ select: false }) // Security: Never return the password in queries by default
    password: string;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}