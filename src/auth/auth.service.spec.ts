import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: Partial<UsersService>;
  let jwtService: Partial<JwtService>;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('signed-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return access_token if credentials are valid', async () => {
      const user = { id: 1, email: 'test@email.com', password: 'hashed', name: 'Test' };
      (usersService.findByEmail as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const loginDto: LoginDto = { email: user.email, password: 'plain' };
      const result = await service.login(loginDto);

      expect(result).toEqual({ access_token: 'signed-jwt-token' });
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: user.id, email: user.email }, expect.any(Object));
    });

    it('should throw UnauthorizedException if user not found', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

      const loginDto: LoginDto = { email: 'notfound@email.com', password: 'plain' };
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const user = { id: 1, email: 'test@email.com', password: 'hashed', name: 'Test' };
      (usersService.findByEmail as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const loginDto: LoginDto = { email: user.email, password: 'wrong' };
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });
});