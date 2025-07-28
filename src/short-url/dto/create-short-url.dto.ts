import { IsDateString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShortUrlDto {
  @ApiProperty({ example: 'https://www.exemplo.com' })
  @IsUrl()
  originalUrl: string;

  @IsOptional()
  @IsDateString({}, { message: 'A data de expiração deve estar no formato YYYY-MM-DD' })
  expiresAt?: string;
}
