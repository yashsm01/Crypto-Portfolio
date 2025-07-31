import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { KafkaService } from '../kafka/kafka.service';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(WebsocketGateway.name);
  @WebSocketServer() server: Server;

  constructor(private readonly kafkaService: KafkaService) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
    this.startKafkaConsumer();
  }

  handleConnection(client: Socket) {
    const userId = this.getUserIdFromToken(client);
    if (userId) {
      client.join(`user-${userId}`);
      this.logger.log(`Client connected: ${client.id}, User: ${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  private getUserIdFromToken(client: Socket): number | null {
    try {
      const token = client.handshake.auth.token;
      if (!token) return null;
      
      // Simple token parsing (you should use your JWT service here)
      const base64Payload = token.split('.')[1];
      const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
      return payload.sub; // userId from JWT
    } catch (error) {
      return null;
    }
  }

  private async startKafkaConsumer() {
    await this.kafkaService.startNotificationConsumer((notification) => {
      // Send to specific user's room
      if (notification.userId) {
        this.server.to(`user-${notification.userId}`).emit('priceUpdate', notification);
      }

      // If it's a significant change, also emit to a general channel
      if (notification.isSignificant) {
        this.server.emit('significantPriceChange', notification);
      }
    });
  }
}