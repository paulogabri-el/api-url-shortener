import { Test, TestingModule } from '@nestjs/testing';
import { ClicksService } from './clicks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Click } from './entities/click.entity';
import { ShortUrl } from 'src/short-url/entities/short-url.entity';
import { Repository } from 'typeorm';

describe('ClicksService', () => {
  let service: ClicksService;
  let clickRepository: Partial<Record<keyof Repository<Click>, jest.Mock>>;
  let shortUrlRepository: Partial<Record<keyof Repository<ShortUrl>, jest.Mock>>;

  beforeEach(async () => {
    clickRepository = {
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
    };
    shortUrlRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClicksService,
        { provide: getRepositoryToken(Click), useValue: clickRepository },
        { provide: getRepositoryToken(ShortUrl), useValue: shortUrlRepository },
      ],
    }).compile();

    service = module.get<ClicksService>(ClicksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('trackClick', () => {
    it('should do nothing if shortUrl not found', async () => {
      (shortUrlRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.trackClick('notfound');
      expect(shortUrlRepository.findOne).toHaveBeenCalledWith({ where: { shortCode: 'notfound' } });
      expect(clickRepository.create).not.toHaveBeenCalled();
      expect(clickRepository.save).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('should create and save a click if shortUrl is found', async () => {
      const shortUrl = { id: 1, shortCode: 'abc123' } as ShortUrl;
      (shortUrlRepository.findOne as jest.Mock).mockResolvedValue(shortUrl);
      const click = { id: 1 };
      (clickRepository.create as jest.Mock).mockReturnValue(click);
      (clickRepository.save as jest.Mock).mockResolvedValue(click);

      await service.trackClick('abc123', '127.0.0.1', 'agent');

      expect(shortUrlRepository.findOne).toHaveBeenCalledWith({ where: { shortCode: 'abc123' } });
      expect(clickRepository.create).toHaveBeenCalledWith({
        shortUrl,
        ipAddress: '127.0.0.1',
        userAgent: 'agent',
      });
      expect(clickRepository.save).toHaveBeenCalledWith(click);
    });
  });

  describe('getClickCount', () => {
    it('should return the count of clicks for a shortCode', async () => {
      (clickRepository.count as jest.Mock).mockResolvedValue(7);

      const result = await service.getClickCount('abc123');
      expect(clickRepository.count).toHaveBeenCalledWith({
        where: { shortUrl: { shortCode: 'abc123' } },
      });
      expect(result).toBe(7);
    });
  });
});
