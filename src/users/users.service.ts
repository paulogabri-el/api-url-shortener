import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async create(createUserDto: CreateUserDto) {
    this.logger.log('Iniciando criação de usuário', createUserDto.email);

    if (!createUserDto.name || createUserDto.name.trim() === '') {
      this.logger.warn(`Nome do usuário é obrigatório para cadastro!: ${createUserDto.email}`);
      throw new BadRequestException('O nome é obrigatório.');
    }

    const { email, password } = createUserDto;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('O e-mail informado não é válido.');
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
    if (!passwordRegex.test(password)) {
      throw new BadRequestException(
        'A senha deve conter no mínimo 6 caracteres, incluindo uma letra maiúscula, uma letra minúscula, um número e um símbolo.',
      );
    }

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      this.logger.warn('E-mail já cadastrado: ${email}');
      throw new ConflictException('E-mail já cadastrado.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(newUser);

    return {
      id: savedUser.id,
      name: savedUser.name,
      email: savedUser.email,
    };
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      this.logger.warn(`Usuário com ID ${id} não encontrado.`);
      throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }
    return user;
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }
}
