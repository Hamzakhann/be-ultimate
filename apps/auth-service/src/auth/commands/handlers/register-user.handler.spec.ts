import { Test, TestingModule } from '@nestjs/testing';
import { RegisterUserHandler } from './register-user.handler.js';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity.js';
import { EventBus } from '@nestjs/cqrs';
import { RpcException } from '@nestjs/microservices';
import * as argon2 from 'argon2';
import { RegisterUserCommand } from '../impl/register-user.command.js';
import { UserRegisteredEvent } from '../../events/impl/user-registered.event.js';

jest.mock('argon2');

describe('RegisterUserHandler', () => {
  let handler: RegisterUserHandler;
  let repo: any;
  let eventBus: EventBus;

  const mockRepo = {
    save: jest.fn(),
  };

  const mockEventBus = {
    publish: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUserHandler,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepo,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    handler = module.get<RegisterUserHandler>(RegisterUserHandler);
    repo = module.get(getRepositoryToken(User));
    eventBus = module.get<EventBus>(EventBus);
  });

  it('should successfully register a user and publish event', async () => {
    const command = new RegisterUserCommand('test@example.com', 'password');
    const hashedPassword = 'hashed_password';
    const savedUser = { id: 'uuid', email: command.email };

    (argon2.hash as jest.Mock).mockResolvedValue(hashedPassword);
    repo.save.mockResolvedValue(savedUser);

    const result = await handler.execute(command);

    expect(result).toEqual({
      message: 'User registered successfully',
      userId: 'uuid',
    });
    expect(repo.save).toHaveBeenCalledWith({
      email: command.email,
      password: hashedPassword,
    });
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(UserRegisteredEvent),
    );
  });

  it('should throw RpcException on duplicate email', async () => {
    const command = new RegisterUserCommand('test@example.com', 'password');
    repo.save.mockRejectedValue({ code: '23505' });

    await expect(handler.execute(command)).rejects.toThrow(RpcException);
  });
});
