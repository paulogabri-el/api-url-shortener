import { PartialType } from '@nestjs/mapped-types';
import { CreateShortUrlDto } from './create-short-url.dto';

export class UpdateUrlDto extends PartialType(CreateShortUrlDto) {}
