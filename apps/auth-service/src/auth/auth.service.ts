import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity.js';
import * as argon2 from 'argon2';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly jwtService: JwtService,
  ) { }

  /**
   * Validate user credentials against the auth DB.
   * Returns partial user object (no password) on success.
   */
  async validateUser(
    email: string,
    pass: string,
  ): Promise<{ id: string; email: string }> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (!user) {
      throw new RpcException({ statusCode: 401, message: 'Invalid credentials' });
    }

    const isMatch = await argon2.verify(user.password, pass);
    if (!isMatch) {
      throw new RpcException({ statusCode: 401, message: 'Invalid credentials' });
    }

    return { id: user.id, email: user.email };
  }

  /**
   * Issue a signed JWT for the authenticated user.
   */
  async login(user: { id: string; email: string }) {
    const payload = { sub: user.id, email: user.email };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}