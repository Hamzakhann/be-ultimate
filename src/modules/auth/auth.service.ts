import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private auditService: AuditService, // Inject Audit
  ) { }

  // Ensure this method is named exactly 'validateUser'
  async validateUser(email: string, pass: string): Promise<{ id: string; email: string }> {
    const user = await this.usersService.findWithPassword(email);

    // Fix: 'user' is possibly 'null' check
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await argon2.verify(user.password, pass);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return { id: user.id, email: user.email };
  }

  // Ensure this method takes ONE object argument
  async login(user: { id: string; email: string }, ip: string) {
    const payload = { sub: user.id, email: user.email };

    // Log the action to MongoDB (Async - don't wait if not critical)
    this.auditService.log(user.id, 'USER_LOGIN', { email: user.email }, ip);

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}