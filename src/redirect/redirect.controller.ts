import { Controller, Get, NotFoundException, Param, Req, Res } from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ShortUrlService } from 'src/short-url/short-url.service';
import { ClicksService } from 'src/clicks/clicks.service';

@ApiTags('Redirecionamento')
@Controller()
export class RedirectController {
  constructor(private readonly shortUrlService: ShortUrlService,
    private readonly clicksService: ClicksService
  ) { }

  @Get(':shortCode')
  @ApiOperation({ summary: 'Redirecionar código para a URL original' })
  async redirect(@Param('shortCode') shortCode: string, @Req() req: Request, @Res() res: Response) {
    const shortUrl = await this.shortUrlService.findByShortCode(shortCode);

    if (!shortUrl) {
      throw new NotFoundException('Short URL not found');
    }

    const ip = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';

    await this.clicksService.trackClick(shortCode, ip, userAgent);

    return res.redirect(shortUrl.originalUrl);
  }

  getClientIp(req: Request): string {
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (typeof xForwardedFor === 'string') {
      const forwardedIps = xForwardedFor.split(',').map(ip => ip.trim());
      if (forwardedIps.length > 0) {
        return forwardedIps[0];
      }
    }

    const ip = req.socket?.remoteAddress || req.connection?.remoteAddress || '';

    return ip.replace(/^::ffff:/, '');
  }
}
