import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ShortUrl } from 'src/short-url/entities/short-url.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ApiProperty({ example: 'usuario@email.com' })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ example: 'SenhaSegura@123' })
  @Column()
  password: string;

  @OneToMany(() => ShortUrl, shortUrl => shortUrl.user)
  shortUrls: ShortUrl[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
