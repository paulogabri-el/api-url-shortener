import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShortUrl } from './entities/short-url.entity';
import { ShortUrlService } from './short-url.service';
import { ShortUrlController } from './short-url.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ShortUrl])],
  controllers: [ShortUrlController],
  providers: [ShortUrlService],
  exports: [TypeOrmModule, ShortUrlService],
})
export class UrlsModule {}
