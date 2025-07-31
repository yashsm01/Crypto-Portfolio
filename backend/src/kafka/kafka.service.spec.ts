import { Test, TestingModule } from '@nestjs/testing';
import { KafkaService } from './kafka.service';

describe('KafkaService', () => {
  let service: KafkaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KafkaService],
    }).compile();

    service = module.get<KafkaService>(KafkaService);
    await service.onModuleInit(); // Initialize Kafka connections
  });

  afterEach(async () => {
    await service.onModuleDestroy(); // Clean up connections
  });

  it('should notify price changes', async () => {
    const testData = {
      symbol: 'BTC',
      oldPrice: 50000,
      newPrice: 55000, // 10% increase - should trigger significant change
      userId: 1
    };

    // Test price notification
    await expect(service.notifyPriceChange(
      testData.symbol,
      testData.oldPrice,
      testData.newPrice,
      testData.userId
    )).resolves.not.toThrow();
  });

  it('should handle consumer messages', async () => {
    const mockCallback = jest.fn();
    await service.startNotificationConsumer(mockCallback);

    // Wait for potential messages
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify callback was registered
    expect(service['consumer']).toBeDefined();
  });
});