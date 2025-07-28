import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let repo: Partial<Record<keyof Repository<User>, jest.Mock>>;

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw BadRequestException for invalid email', async () => {
      await expect(
        service.create({ email: 'invalid', password: 'Teste@123', name: 'Test' } as any)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid password', async () => {
      await expect(
        service.create({ email: 'test@email.com', password: 'abc', name: 'Test' } as any)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if email already exists', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      await expect(
        service.create({ email: 'test@email.com', password: 'Teste@123', name: 'Test' } as any)
      ).rejects.toThrow(ConflictException);
    });

    it('should hash password and save user', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(undefined);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      const userEntity = { id: 1, name: 'Test', email: 'test@email.com' };
      (repo.create as jest.Mock).mockReturnValue(userEntity);
      (repo.save as jest.Mock).mockResolvedValue(userEntity);

      const result = await service.create({
        email: 'test@email.com',
        password: 'Teste@123',
        name: 'Test',
      } as any);

      expect(bcrypt.hash).toHaveBeenCalledWith('Teste@123', 10);
      expect(repo.create).toHaveBeenCalledWith({
        email: 'test@email.com',
        password: 'hashed',
        name: 'Test',
      });
      expect(repo.save).toHaveBeenCalledWith(userEntity);
      expect(result).toEqual({
        id: 1,
        name: 'Test',
        email: 'test@email.com',
      });
    });
  });

  describe('findOne', () => {
    it('should return user if found', async () => {
      const user = { id: 1, name: 'Test' };
      (repo.findOneBy as jest.Mock).mockResolvedValue(user);

      const result = await service.findOne(1);
      expect(result).toBe(user);
    });

    it('should throw NotFoundException if user not found', async () => {
      (repo.findOneBy as jest.Mock).mockResolvedValue(undefined);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      const user = { id: 1, email: 'test@email.com' };
      (repo.findOne as jest.Mock).mockResolvedValue(user);

      const result = await service.findByEmail('test@email.com');
      expect(repo.findOne).toHaveBeenCalledWith({ where: { email: 'test@email.com' } });
      expect(result).toBe(user);
    });
  });
});