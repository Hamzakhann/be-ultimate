import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
        const existing = await this.userRepository.findOne({ where: { email: createUserDto.email } });
        if (existing) throw new ConflictException('User already exists');

        const hashedPassword = await argon2.hash(createUserDto.password);
        const user = this.userRepository.create({ ...createUserDto, password: hashedPassword });

        const { password, ...result } = await this.userRepository.save(user);
        return result;
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { email } });
    }

    // Specifically for Auth: Includes the hidden password field
    async findWithPassword(email: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: { email },
            select: ['id', 'email', 'password'],
        });
    }
}