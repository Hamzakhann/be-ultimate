import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service.js';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity.js';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import * as argon2 from 'argon2';

jest.mock('argon2');

describe('AuthService', () => {
  let service: AuthService;
  let repo: any;
  let jwtService: JwtService;
  let kafkaClient: any;

  const mockQueryBuilder = {
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };

  const mockRepo = {
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockKafkaClient = {
    connect: jest.fn(),
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepo,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: 'AUTH_KAFKA_CLIENT',
          useValue: mockKafkaClient,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    repo = module.get(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
    kafkaClient = module.get('AUTH_KAFKA_CLIENT');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should successfully register a user', async () => {
      const dto = { email: 'test@example.com', password: 'password' };
      const hashedPassword = 'hashed_password';
      const savedUser = { id: 'uuid', email: dto.email };

      (argon2.hash as jest.Mock).mockResolvedValue(hashedPassword);
      repo.save.mockResolvedValue(savedUser);

      const result = await service.register(dto);

      expect(result).toEqual({
        message: 'User registered successfully',
        userId: 'uuid',
      });
      expect(repo.save).toHaveBeenCalledWith({
        ...dto,
        password: hashedPassword,
      });
      expect(kafkaClient.emit).toHaveBeenCalledWith('user.created', {
        userId: 'uuid',
        email: dto.email,
      });
    });

    it('should throw RpcException on duplicate email', async () => {
      const dto = { email: 'test@example.com', password: 'password' };
      repo.save.mockRejectedValue({ code: '23505' });

      await expect(service.register(dto)).rejects.toThrow(RpcException);
    });
  });

  describe('validateUser', () => {
    it('should return user on valid credentials', async () => {
      const email = 'test@example.com';
      const pass = 'password';
      const user = { id: 'uuid', email, password: 'hashed_password' };

      mockQueryBuilder.getOne.mockResolvedValue(user);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(email, pass);

      expect(result).toEqual({ id: 'uuid', email });
    });

    it('should throw RpcException on invalid password', async () => {
      const email = 'test@example.com';
      const pass = 'wrong';
      const user = { id: 'uuid', email, password: 'hashed_password' };

      mockQueryBuilder.getOne.mockResolvedValue(user);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.validateUser(email, pass)).rejects.toThrow(RpcException);
    });
  });

  describe('login', () => {
    it('should return an access token', async () => {
      const user = { id: 'uuid', email: 'test@example.com' };
      const token = 'signed_token';

      (mockJwtService.sign as jest.Mock).mockReturnValue(token);

      const result = await service.login(user);

      expect(result).toEqual({ access_token: token });
      expect(mockJwtService.sign).toHaveBeenCalledWith({ sub: user.id, email: user.email });
    });
  });
});
