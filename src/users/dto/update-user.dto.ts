import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ example: 'Novo Nome' })
  name?: string;

  @ApiPropertyOptional({ example: 'novo@email.com' })
  email?: string;

  @ApiPropertyOptional({ example: 'NovaSenha123@' })
  password?: string;
}
