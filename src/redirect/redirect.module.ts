import { Module } from '@nestjs/common';
import { UrlsModule } from 'src/short-url/short-url.module';
import { RedirectController } from './redirect.controller';
import { ClicksModule } from 'src/clicks/clicks.module';

@Module({
  imports: [UrlsModule, ClicksModule],
  controllers: [RedirectController],
})
export class RedirectModule {}
