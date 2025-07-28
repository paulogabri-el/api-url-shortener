import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  async login(loginDto: LoginDto) {
    this.logger.log(`Tentativa de login para o usuário: ${loginDto.email}`);

    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
      this.logger.warn(`Credenciais inválidas para o usuário: ${loginDto.email}`);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload, {
      expiresIn: '10m',
    });

    if (token) {
      this.logger.log(`Login realizado com sucesso para o usuário: ${loginDto.email}`);
    }

    return {
      access_token: token,
    };
  }
}
