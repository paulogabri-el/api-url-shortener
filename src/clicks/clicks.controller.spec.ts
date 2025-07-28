import { Test, TestingModule } from '@nestjs/testing';
import { ClicksController } from './clicks.controller';
import { ClicksService } from './clicks.service';

describe('ClicksController', () => {
  let controller: ClicksController;
  let clicksService: Partial<ClicksService>;

  beforeEach(async () => {
    clicksService = {
      getClickCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClicksController],
      providers: [
        { provide: ClicksService, useValue: clicksService },
      ],
    }).compile();

    controller = module.get<ClicksController>(ClicksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call clicksService.getClickCount with the correct shortCode', async () => {
    const shortCode = 'abc123';
    (clicksService.getClickCount as jest.Mock).mockResolvedValue(5);

    const result = await controller.getClickCount(shortCode);

    expect(clicksService.getClickCount).toHaveBeenCalledWith(shortCode);
  });
});
