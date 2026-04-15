import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile } from './entities/user-profile.entity.js';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(
        @InjectRepository(UserProfile)
        private readonly userProfileRepository: Repository<UserProfile>,
    ) { }

    /**
     * Handle user.created event from Kafka
     */
    async handleUserCreated(data: { userId: string, email: string }) {
        this.logger.log(`Handling user.created event for userId: ${data.userId}`);
        
        // Idempotency check: Ensure profile doesn't already exist
        const existingProfile = await this.userProfileRepository.findOne({
            where: { userId: data.userId }
        });

        if (existingProfile) {
            this.logger.warn(`Profile already exists for userId: ${data.userId}, skipping creation.`);
            return;
        }

        const profile = this.userProfileRepository.create({
            userId: data.userId,
            email: data.email,
        });

        await this.userProfileRepository.save(profile);
        this.logger.log(`Successfully created profile for userId: ${data.userId}`);
    }

    /**
     * Get profile by userId
     */
    async getProfile(userId: string) {
        return this.userProfileRepository.findOneOrFail({
            where: { userId }
        });
    }

    /**
     * Update profile
     */
    async updateProfile(userId: string, updateData: Partial<UserProfile>) {
        const profile = await this.getProfile(userId);
        Object.assign(profile, updateData);
        return this.userProfileRepository.save(profile);
    }
}
