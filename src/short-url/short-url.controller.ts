import { Controller, Post, Get, Param, Body, Delete, UseGuards, Request, } from '@nestjs/common';
import { CreateShortUrlDto } from './dto/create-short-url.dto';
import { ShortUrlService } from './short-url.service';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiCreatedResponse, } from '@nestjs/swagger';
import { ShortUrlResponseDto } from './dto/short-url-response.dto';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@ApiTags('Encurtador URLs')
@ApiBearerAuth()
@Controller('short-url')
export class ShortUrlController {
  constructor(private readonly shortUrlService: ShortUrlService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiCreatedResponse({ type: ShortUrlResponseDto })
  async create(
    @Body() createShortUrlDto: CreateShortUrlDto,
  ): Promise<ShortUrlResponseDto> {
    const shortUrl = await this.shortUrlService.create(createShortUrlDto);
    return plainToInstance(ShortUrlResponseDto, shortUrl, { excludeExtraneousValues: true });
  }

  @Post('public')
  @ApiOperation({ summary: 'Cria uma URL encurtada sem autenticação' })
  @ApiResponse({ status: 201, description: 'URL encurtada com sucesso' })
  createPublic(@Body() dto: CreateShortUrlDto) {
    return this.shortUrlService.createAnonymous(dto.originalUrl, dto.expiresAt);
  }

  @Get('short-urls')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lista todas as URLs encurtadas do usuário' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso' })
  findAll(@Request() req) {
    return this.shortUrlService.findAll(req.user.userId);
  }

  @Get(':shortCode')
  @ApiOperation({ summary: 'Retorna a URL original' })
  @ApiResponse({ status: 200, description: 'URL original retornada com sucesso' })
  @ApiResponse({ status: 404, description: 'URL não encontrada' })
  async redirect(@Param('shortCode') code: string) {
    return this.shortUrlService.getUrlByShortCode(code);
  }

  @Delete('short-urls/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove uma URL encurtada do usuário' })
  @ApiResponse({ status: 200, description: 'URL deletada com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'URL não encontrada' })
  async remove(@Param('id') id: number, @Request() req) {
    return this.shortUrlService.remove(id, req.user.userId);
  }
}
