import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: Partial<Record<keyof UsersService, jest.Mock>>;

  beforeEach(async () => {
    usersService = {
      create: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call usersService.create and return result', async () => {
      const dto: CreateUserDto = {
        name: 'João da Silva',
        email: 'joaosilva@email.com',
        password: 'Teste@123'
      };
      const user = { id: 1, name: 'João da Silva' };
      (usersService.create as jest.Mock).mockResolvedValue(user);

      const result = await controller.create(dto);

      expect(usersService.create).toHaveBeenCalledWith(dto);
      expect(result).toBe(user);
    });
  });

  describe('getProfile', () => {
    it('should call usersService.findOne with userId and return result', async () => {
      const req = { user: { userId: 42 } };
      const user = { id: 42, name: 'João da Silva' };
      (usersService.findOne as jest.Mock).mockResolvedValue(user);

      const result = await controller.getProfile(req);

      expect(usersService.findOne).toHaveBeenCalledWith(42);
      expect(result).toBe(user);
    });
  });
});