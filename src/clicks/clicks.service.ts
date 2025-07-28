import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Click } from './entities/click.entity';
import { Repository } from 'typeorm';
import { ShortUrl } from 'src/short-url/entities/short-url.entity';

@Injectable()
export class ClicksService {
  constructor(
    @InjectRepository(Click)
    private clickRepository: Repository<Click>,
    @InjectRepository(ShortUrl)
    private shortUrlRepository: Repository<ShortUrl>,
  ) {}

  async trackClick(shortCode: string, ip?: string, userAgent?: string) {
    const shortUrl = await this.shortUrlRepository.findOne({
      where: { shortCode },
    });

    if (!shortUrl) return;

    const click = this.clickRepository.create({
      shortUrl,
      ipAddress: ip,
      userAgent,
    });

    await this.clickRepository.save(click);
  }

  async getClickCount(shortCode: string) {
    return this.clickRepository.count({
      where: {
        shortUrl: { shortCode },
      },
    });
  }
}
