import { Test, TestingModule } from '@nestjs/testing';
import { WebsocketGateway } from './websocket.gateway';
import { KafkaService } from '../kafka/kafka.service';
import { Socket } from 'socket.io';

describe('WebsocketGateway', () => {
  let gateway: WebsocketGateway;
  let kafkaService: KafkaService;

  const mockSocket = {
    id: 'test-socket-id',
    handshake: {
      auth: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiaWF0IjoxNTE2MjM5MDIyfQ.L8i6g3PfcHlioHCCPURC9pmXT7gdJpx3kOoyAfNUwCc'
      }
    },
    join: jest.fn(),
  } as unknown as Socket;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebsocketGateway,
        {
          provide: KafkaService,
          useValue: {
            startNotificationConsumer: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<WebsocketGateway>(WebsocketGateway);
    kafkaService = module.get<KafkaService>(KafkaService);
  });

  it('should handle client connection', () => {
    gateway.handleConnection(mockSocket);
    expect(mockSocket.join).toHaveBeenCalledWith('user-1');
  });

  it('should start Kafka consumer on init', () => {
    gateway.afterInit();
    expect(kafkaService.startNotificationConsumer).toHaveBeenCalled();
  });
});