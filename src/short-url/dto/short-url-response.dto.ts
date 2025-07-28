import { Expose, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export class ShortUrlResponseDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  originalUrl: string;

  @ApiProperty()
  @Expose()
  shortCode: string;

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => value ? dayjs(value).tz('America/Sao_Paulo').format() : null)
  createdAt: string;

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => value ? dayjs(value).tz('America/Sao_Paulo').format() : null)
  updatedAt: string;

  @ApiProperty({ required: false })
  @Expose()
  @Transform(({ value }) => value ? dayjs(value).tz('America/Sao_Paulo').format() : null)
  expiresAt?: string;
}
