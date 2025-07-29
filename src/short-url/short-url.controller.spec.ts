import { Test, TestingModule } from '@nestjs/testing';
import { ShortUrlController } from './short-url.controller';
import { ShortUrlService } from './short-url.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateShortUrlDto } from './dto/create-short-url.dto';

describe('ShortUrlController', () => {
  let controller: ShortUrlController;
  let service: Partial<Record<keyof ShortUrlService, jest.Mock>>;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      createAnonymous: jest.fn(),
      findAll: jest.fn(),
      getUrlByShortCode: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShortUrlController],
      providers: [
        { provide: ShortUrlService, useValue: service },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<ShortUrlController>(ShortUrlController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create and return ShortUrlResponseDto', async () => {
      const dto: CreateShortUrlDto = { originalUrl: 'https://test.com' };
      const shortUrl = { id: 1, originalUrl: dto.originalUrl, shortCode: 'abc123' };
      (service.create as jest.Mock).mockResolvedValue(shortUrl);

      const req = { user: { userId: 42 } };
      const result = await controller.create(req, dto);

      expect(service.create).toHaveBeenCalledWith(dto, 42);
      expect(result).toMatchObject({ id: 1 });
    });
  });

  describe('createPublic', () => {
    it('should call service.createAnonymous and return result', async () => {
      const dto: CreateShortUrlDto = { originalUrl: 'https://test.com' };
      const created = { id: 2, originalUrl: dto.originalUrl, shortCode: 'xyz789' };
      (service.createAnonymous as jest.Mock).mockResolvedValue(created);

      const result = await controller.createPublic(dto);

      expect(service.createAnonymous).toHaveBeenCalledWith(dto.originalUrl, undefined);
      expect(result).toMatchObject({
        id: 2,
        originalUrl: 'https://test.com',
        shortCode: 'xyz789',
        redirectUrl: expect.stringContaining('xyz789'),
      });
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with userId', async () => {
      const req = { user: { userId: 42 } };
      const urls = [{ id: 1 }, { id: 2 }];
      (service.findAll as jest.Mock).mockResolvedValue(urls);

      const result = await controller.findAll(req);

      expect(service.findAll).toHaveBeenCalledWith(42);
      expect(result).toBe(urls);
    });
  });

  describe('redirect', () => {
    it('should call service.getUrlByShortCode and return result', async () => {
      (service.getUrlByShortCode as jest.Mock).mockResolvedValue('URL Original: https://test.com');
      const result = await controller.redirect('abc123');
      expect(service.getUrlByShortCode).toHaveBeenCalledWith('abc123');
      expect(result).toBe('URL Original: https://test.com');
    });
  });
});