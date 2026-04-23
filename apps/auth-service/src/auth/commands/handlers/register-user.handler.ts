import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { RegisterUserCommand } from '../impl/register-user.command.js';
import { UserRegisteredEvent } from '../../events/impl/user-registered.event.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity.js';
import { RpcException } from '@nestjs/microservices';
import * as argon2 from 'argon2';

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler implements ICommandHandler<RegisterUserCommand> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RegisterUserCommand) {
    const { email, password } = command;

    try {
      const hashedPassword = await argon2.hash(password);

      const user = await this.userRepository.save({
        email,
        password: hashedPassword,
      });

      // Publish Event
      this.eventBus.publish(new UserRegisteredEvent(user.id, user.email));

      return {
        message: 'User registered successfully',
        userId: user.id,
      };
    } catch (error) {
      if (error.code === '23505') {
        throw new RpcException({
          statusCode: 409,
          message: 'User with this email already exists',
        });
      }
      throw new RpcException(error.message);
    }
  }
}
