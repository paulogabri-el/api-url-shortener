import { Test, TestingModule } from '@nestjs/testing';
import { RedirectController } from './redirect.controller';
import { ShortUrlService } from 'src/short-url/short-url.service';
import { ClicksService } from 'src/clicks/clicks.service';
import { NotFoundException } from '@nestjs/common';

describe('RedirectController', () => {
  let controller: RedirectController;
  let shortUrlService: Partial<Record<string, jest.Mock>>;
  let clicksService: Partial<Record<string, jest.Mock>>;

  beforeEach(async () => {
    shortUrlService = {
      findByShortCode: jest.fn(),
    };
    clicksService = {
      trackClick: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RedirectController],
      providers: [
        { provide: ShortUrlService, useValue: shortUrlService },
        { provide: ClicksService, useValue: clicksService },
      ],
    }).compile();

    controller = module.get<RedirectController>(RedirectController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('redirect', () => {
    it('should throw NotFoundException if shortUrl not found', async () => {
      (shortUrlService.findByShortCode as jest.Mock).mockResolvedValue(null);

      const req: any = { headers: {}, socket: { remoteAddress: '1.2.3.4' } };
      const res: any = { redirect: jest.fn() };

      await expect(controller.redirect('notfound', req, res)).rejects.toThrow(NotFoundException);
      expect(shortUrlService.findByShortCode).toHaveBeenCalledWith('notfound');
    });

    it('should track click and redirect if shortUrl is found', async () => {
      const shortUrl = { originalUrl: 'https://example.com' };
      (shortUrlService.findByShortCode as jest.Mock).mockResolvedValue(shortUrl);

      const req: any = {
        headers: { 'user-agent': 'jest', 'x-forwarded-for': '8.8.8.8' },
        socket: { remoteAddress: '1.2.3.4' },
      };
      const res: any = { redirect: jest.fn() };

      await controller.redirect('abc123', req, res);

      expect(shortUrlService.findByShortCode).toHaveBeenCalledWith('abc123');
      expect(clicksService.trackClick).toHaveBeenCalledWith('abc123', '8.8.8.8', 'jest');
      expect(res.redirect).toHaveBeenCalledWith('https://example.com');
    });

    it('should fallback to socket remoteAddress if x-forwarded-for is not present', async () => {
      const shortUrl = { originalUrl: 'https://example.com' };
      (shortUrlService.findByShortCode as jest.Mock).mockResolvedValue(shortUrl);

      const req: any = {
        headers: { 'user-agent': 'jest' },
        socket: { remoteAddress: '1.2.3.4' },
      };
      const res: any = { redirect: jest.fn() };

      await controller.redirect('abc123', req, res);

      expect(clicksService.trackClick).toHaveBeenCalledWith('abc123', '1.2.3.4', 'jest');
      expect(res.redirect).toHaveBeenCalledWith('https://example.com');
    });
  });

  describe('getClientIp', () => {
    it('should return first IP from x-forwarded-for', () => {
      const req: any = { headers: { 'x-forwarded-for': '8.8.8.8, 1.1.1.1' } };
      expect(controller.getClientIp(req)).toBe('8.8.8.8');
    });

    it('should return remoteAddress if x-forwarded-for is not present', () => {
      const req: any = { headers: {}, socket: { remoteAddress: '1.2.3.4' } };
      expect(controller.getClientIp(req)).toBe('1.2.3.4');
    });

    it('should remove ::ffff: prefix from IPv4-mapped IPv6 addresses', () => {
      const req: any = { headers: {}, socket: { remoteAddress: '::ffff:127.0.0.1' } };
      expect(controller.getClientIp(req)).toBe('127.0.0.1');
    });
  });
});