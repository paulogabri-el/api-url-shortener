import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Click } from 'src/clicks/entities/click.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class ShortUrl {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'https://www.siteoriginal.com' })
  @Column()
  originalUrl: string;

  @ApiProperty({ example: 'Ab12Cd' })
  @Column({ unique: true })
  shortCode: string;

  @ManyToOne(() => User, user => user.shortUrls, { onDelete: 'CASCADE' })
  user: User;

  @OneToMany(() => Click, click => click.shortUrl)
  clicks: Click[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @ApiProperty({ example: '2025-08-01T00:00:00.000Z', required: false })
  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;
}
