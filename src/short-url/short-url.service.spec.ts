import { Test, TestingModule } from '@nestjs/testing';
import { ShortUrlService } from './short-url.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ShortUrl } from './entities/short-url.entity';
import { Repository } from 'typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { nanoid } from 'nanoid';

jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'abcdef'),
}));

describe('ShortUrlService', () => {
  let service: ShortUrlService;
  let repo: Partial<Record<keyof Repository<ShortUrl>, jest.Mock>>;

  beforeEach(async () => {
    repo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShortUrlService,
        { provide: getRepositoryToken(ShortUrl), useValue: repo },
      ],
    }).compile();

    service = module.get<ShortUrlService>(ShortUrlService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should prepend https:// if not present and save', async () => {
      const dto = { originalUrl: 'google.com' };
      const entity = { originalUrl: 'https://google.com', shortCode: 'abcdef' };
      (repo.create as jest.Mock).mockReturnValue(entity);
      (repo.save as jest.Mock).mockResolvedValue(entity);

      const result = await service.create(dto as any);

      expect(repo.create).toHaveBeenCalledWith({
        originalUrl: 'https://google.com',
        shortCode: 'abcdef',
      });
      expect(repo.save).toHaveBeenCalledWith(entity);
      expect(result).toBe(entity);
    });

    it('should throw BadRequestException for invalid expiresAt', async () => {
      const dto = { originalUrl: 'https://google.com', expiresAt: 'invalid-date' };
      await expect(service.create(dto as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('createAnonymous', () => {
    it('should prepend https:// if not present and save', async () => {
      const entity = { originalUrl: 'https://google.com', shortCode: 'abcdef' };
      (repo.create as jest.Mock).mockReturnValue(entity);
      (repo.save as jest.Mock).mockResolvedValue(entity);

      const result = await service.createAnonymous('google.com');

      expect(repo.create).toHaveBeenCalledWith({
        originalUrl: 'https://google.com',
        shortCode: 'abcdef',
      });
      expect(repo.save).toHaveBeenCalledWith(entity);
      expect(result).toBe(entity);
    });
  });

  describe('findAll', () => {
    it('should call query builder and return result', async () => {
      const getMany = jest.fn().mockResolvedValue(['url1', 'url2']);
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        loadRelationCountAndMap: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany,
      };
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const result = await service.findAll(1);

      expect(result).toEqual(['url1', 'url2']);
      expect(qb.where).toHaveBeenCalledWith('shortUrl.userId = :userId', { userId: 1 });
    });
  });

  describe('findByShortCode', () => {
    it('should call query builder and return result', async () => {
      const getOne = jest.fn().mockResolvedValue('url');
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        loadRelationCountAndMap: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne,
      };
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const result = await service.findByShortCode('abc123');

      expect(result).toBe('url');
      expect(qb.where).toHaveBeenCalledWith('shortUrl.shortCode = :shortCode', { shortCode: 'abc123' });
    });
  });

  describe('getUrlByShortCode', () => {
    it('should return original url if found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue({ originalUrl: 'https://test.com' });

      const result = await service.getUrlByShortCode('abc123');
      expect(result).toBe('URL Original: https://test.com');
    });

    it('should throw NotFoundException if not found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(undefined);

      await expect(service.getUrlByShortCode('notfound')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove url if found and user matches', async () => {
      const url = { id: 1, user: { id: 2 } };
      (repo.findOne as jest.Mock).mockResolvedValue(url);
      (repo.remove as jest.Mock).mockResolvedValue(undefined);

      const result = await service.remove(1, 2);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 }, relations: ['user'] });
      expect(repo.remove).toHaveBeenCalledWith(url);
      expect(result).toBe('URL deletada com sucesso!');
    });

    it('should throw NotFoundException if url not found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(undefined);

      await expect(service.remove(1, 2)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not match', async () => {
      const url = { id: 1, user: { id: 3 } };
      (repo.findOne as jest.Mock).mockResolvedValue(url);

      await expect(service.remove(1, 2)).rejects.toThrow(ForbiddenException);
    });
  });
});