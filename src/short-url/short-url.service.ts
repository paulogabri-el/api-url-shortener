import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { CreateShortUrlDto } from './dto/create-short-url.dto';
import { nanoid } from 'nanoid';
import { isValid, endOfDay } from 'date-fns';
import fetch from 'node-fetch';
import { parseISO } from 'date-fns';
import { ShortUrl } from './entities/short-url.entity';
import { th } from 'date-fns/locale';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ShortUrlService {
  private readonly logger = new Logger(ShortUrlService.name);

  constructor(
    @InjectRepository(ShortUrl)
    private readonly shortUrlRepo: Repository<ShortUrl>,
    private readonly configService: ConfigService,
  ) { }

  async create(createShortUrlDto: CreateShortUrlDto, userId: number): Promise<ShortUrl> {
    this.logger.log('Iniciando criação de URL encurtada', createShortUrlDto.originalUrl);

    let originalUrl = createShortUrlDto.originalUrl.trim();

    if (!originalUrl.startsWith('http://') && !originalUrl.startsWith('https://')) {
      originalUrl = 'https://' + originalUrl;
    }

    try {
      new URL(originalUrl);
    } catch {
      this.logger.warn('URL inválida informada', originalUrl);
      throw new BadRequestException('A URL informada é inválida.');
    }

    const shortUrl = this.shortUrlRepo.create({
      originalUrl,
      shortCode: nanoid(6),
      user: { id: userId },
    });

    if (createShortUrlDto.expiresAt) {
      const parsed = parseISO(createShortUrlDto.expiresAt);
      if (!isValid(parsed)) {
        this.logger.warn('Data de expiração inválida', createShortUrlDto.expiresAt);
        throw new BadRequestException('Data de expiração inválida. Use o formato YYYY-MM-DD.');
      }

      shortUrl.expiresAt = endOfDay(parsed);
    }

    this.logger.log('URL encurtada criada com sucesso', shortUrl.shortCode);
    return await this.shortUrlRepo.save(shortUrl);
  }


  async createAnonymous(originalUrl: string, expiresAt?: string): Promise<ShortUrl> {
    this.logger.log('Criando URL encurtada anônima', originalUrl);

    originalUrl = originalUrl.trim();
    if (!originalUrl.startsWith('http')) {
      originalUrl = 'https://' + originalUrl;
    }

    try {
      new URL(originalUrl);
    } catch {
      this.logger.warn('URL inválida informada (anônima)', originalUrl);
      throw new BadRequestException('A URL informada é inválida.');
    }

    const shortUrl = this.shortUrlRepo.create({
      originalUrl,
      shortCode: nanoid(6),
    });

    this.logger.log('URL encurtada anônima criada', shortUrl.shortCode);
    return await this.shortUrlRepo.save(shortUrl);
  }

  async findAll(userId: number) {
    this.logger.log('Buscando todas as URLs encurtadas do usuário', userId);
    const baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost';
    const port = this.configService.get<string>('PORT') || '3000';

    const urls = this.shortUrlRepo
      .createQueryBuilder('shortUrl')
      .loadRelationCountAndMap('shortUrl.clickCount', 'shortUrl.clicks')
      .where('shortUrl.userId = :userId', { userId })
      .andWhere(
        '(shortUrl.expiresAt IS NULL OR shortUrl.expiresAt >= :now)',
        { now: new Date().toISOString() },
      )
      .getMany();

    return (await urls).map((shortUrl) => ({
      ...shortUrl,
      redirectUrl: `${baseUrl}:${port}/${shortUrl.shortCode}`,
    }));
  }

  async findByShortCode(shortCode: string): Promise<ShortUrl | null> {
    this.logger.log('Buscando URL por código', shortCode);

    return this.shortUrlRepo
      .createQueryBuilder('shortUrl')
      .leftJoinAndSelect('shortUrl.clicks', 'click')
      .loadRelationCountAndMap('shortUrl.clickCount', 'shortUrl.clicks')
      .where('shortUrl.shortCode = :shortCode', { shortCode })
      .andWhere(
        '(shortUrl.expiresAt IS NULL OR shortUrl.expiresAt >= :now)',
        { now: new Date() },
      )
      .getOne();
  }

  async getUrlByShortCode(code: string): Promise<string> {
    this.logger.log('Buscando URL original por código da URL encurtada', code);

    const url = await this.shortUrlRepo.findOne({
      where: { shortCode: code },
    });

    if (!url) {
      this.logger.warn(`URL com shortCode ${code} não encontrada.`);
      throw new NotFoundException('URL não encontrada');
    }

    return 'URL Original: ' + url.originalUrl;
  }
}
