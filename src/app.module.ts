import { Module, Redirect } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { UrlsModule } from './short-url/short-url.module';
import { ClicksModule } from './clicks/clicks.module';
import { User } from './users/entities/user.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { ShortUrl } from './short-url/entities/short-url.entity';
import { Click } from './clicks/entities/click.entity';
import { AuthModule } from './auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { RedirectModule } from './redirect/redirect.module';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DATABASE_HOST'),
        port: config.get<number>('DATABASE_PORT'),
        username: config.get<string>('DATABASE_USERNAME'),
        password: config.get<string>('DATABASE_PASSWORD'),
        database: config.get<string>('DATABASE_NAME'),
        entities: [User, ShortUrl, Click],
        synchronize: true, // Utilizar somente em ambiente de desenvolvimento. Ele altera automaticamente o esquema do banco de dados de acordo com as entidades.
      }),
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        autoLogging: false,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        },
      },
    }),
    UsersModule, AuthModule, UrlsModule, ClicksModule, RedirectModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
