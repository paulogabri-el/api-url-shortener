import { Module } from '@nestjs/common';
import { ClicksService } from './clicks.service';
import { ClicksController } from './clicks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Click } from './entities/click.entity';
import { UrlsModule } from '../short-url/short-url.module'; // <-- Importa o módulo

@Module({
  imports: [TypeOrmModule.forFeature([Click]), UrlsModule],
  controllers: [ClicksController],
  providers: [ClicksService],
  exports: [ClicksService], // Exporta o serviço para uso em outros módulos
})
export class ClicksModule {}
