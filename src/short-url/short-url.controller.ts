import { Controller, Post, Get, Param, Body, UseGuards, Request, BadRequestException, } from '@nestjs/common';
import { CreateShortUrlDto } from './dto/create-short-url.dto';
import { ShortUrlService } from './short-url.service';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiCreatedResponse, } from '@nestjs/swagger';
import { ShortUrlResponseDto } from './dto/short-url-response.dto';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';

@ApiTags('Encurtador URLs')
@ApiBearerAuth()
@Controller('short-url')
export class ShortUrlController {
  private readonly configService: ConfigService;
  constructor(
    private readonly shortUrlService: ShortUrlService,
  ) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiCreatedResponse({ type: ShortUrlResponseDto })
  async create(
    @Request() req,
    @Body() createShortUrlDto: CreateShortUrlDto,
  ): Promise<any> {
    const shortUrl = await this.shortUrlService.create(createShortUrlDto, req.user.userId);

    // Usa BASE_URL e PORT do .env, mas mantém fallback para não quebrar testes
    const baseUrl = this.configService?.get<string>('BASE_URL') || 'http://localhost';
    const port = this.configService?.get<string>('PORT') || '3000';

    return {
      ...plainToInstance(ShortUrlResponseDto, shortUrl, { excludeExtraneousValues: true }),
      redirectUrl: `${baseUrl}:${port}/${shortUrl.shortCode}`,
    };
  }

  @Post('public')
  @ApiOperation({ summary: 'Cria uma URL encurtada sem autenticação' })
  @ApiResponse({ status: 201, description: 'URL encurtada com sucesso' })
  async createPublic(@Body() dto: CreateShortUrlDto) {
    const shortUrl = await this.shortUrlService.createAnonymous(dto.originalUrl, dto.expiresAt);

    // Usa BASE_URL e PORT do .env, mas mantém fallback para não quebrar testes
    const baseUrl = this.configService?.get<string>('BASE_URL') || 'http://localhost';
    const port = this.configService?.get<string>('PORT') || '3000';

    return {
      ...plainToInstance(ShortUrlResponseDto, shortUrl, { excludeExtraneousValues: true }),
      redirectUrl: `${baseUrl}:${port}/${shortUrl.shortCode}`,
    };
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
}
