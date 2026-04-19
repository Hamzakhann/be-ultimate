import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { CacheService } from '../../common/cache/cache.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly cacheService: CacheService,
    ) { }

    async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
        const existing = await this.userRepository.findOne({ where: { email: createUserDto.email } });
        if (existing) throw new ConflictException('User already exists');

        const hashedPassword = await argon2.hash(createUserDto.password);

        // Create the user instance
        const user = this.userRepository.create({
            ...createUserDto,
            password: hashedPassword
        });

        // Save the user to the database
        const savedUser = await this.userRepository.save(user);

        const { password, ...result } = savedUser;
        return result;
    }

    async findByEmail(email: string): Promise<User | null> {
        const cacheKey = `user_profile:${email}`;

        return this.cacheService.getOrSet(
            cacheKey,
            async () => {
                // This only runs if data is NOT in Redis
                return this.userRepository.findOne({
                    where: { email },
                });
            },
            600, // Cache for 10 minutes
        );
    }

    async findWithPassword(email: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: { email },
            select: ['id', 'email', 'password'],
        });
    }
}