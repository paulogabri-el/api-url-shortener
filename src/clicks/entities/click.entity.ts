import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ShortUrl } from 'src/short-url/entities/short-url.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Click {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ShortUrl, shortUrl => shortUrl.clicks, { onDelete: 'CASCADE' })
  shortUrl: ShortUrl;

  @ApiProperty({ example: '2025-07-27T17:00:00.000Z' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  clickedAt: Date;

  @ApiProperty({ example: '192.168.0.1', required: false })
  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ nullable: true })
  userAgent?: string;
}
