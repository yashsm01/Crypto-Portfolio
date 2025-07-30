import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer, Consumer, Partitioners } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly kafka: Kafka;
  private readonly producer: Producer;
  private readonly consumer: Consumer;
  private readonly admin: any;
  private readonly PRICE_UPDATES_TOPIC = 'crypto-price-updates';
  private readonly SIGNIFICANT_CHANGE_THRESHOLD = 5; // 5% change threshold
  private readonly MAX_RETRIES = 5;
  private readonly RETRY_INTERVAL = 5000; // 5 seconds

  constructor() {
    const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
    this.kafka = new Kafka({
      clientId: 'crypto-portfolio',
      brokers,
      retry: {
        initialRetryTime: 1000,
        retries: 10
      }
    });

    this.producer = this.kafka.producer({
      createPartitioner: Partitioners.LegacyPartitioner
    });
    this.consumer = this.kafka.consumer({ groupId: 'crypto-portfolio-group' });
    this.admin = this.kafka.admin();
  }

  private async retryConnect(operation: () => Promise<void>, name: string): Promise<void> {
    for (let i = 0; i < this.MAX_RETRIES; i++) {
      try {
        await operation();
        console.log(`Successfully connected to ${name}`);
        return;
      } catch (error) {
        console.error(`Failed to connect to ${name}, attempt ${i + 1}/${this.MAX_RETRIES}`);
        if (i < this.MAX_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_INTERVAL));
        } else {
          throw error;
        }
      }
    }
  }

  private async ensureTopicExists(): Promise<void> {
    try {
      const topics = await this.admin.listTopics();
      if (!topics.includes(this.PRICE_UPDATES_TOPIC)) {
        await this.admin.createTopics({
          topics: [{
            topic: this.PRICE_UPDATES_TOPIC,
            numPartitions: 1,
            replicationFactor: 1
          }]
        });
        console.log(`Created topic: ${this.PRICE_UPDATES_TOPIC}`);
      }
    } catch (error) {
      console.error('Error ensuring topic exists:', error);
      throw error;
    }
  }

  async onModuleInit() {
    await this.retryConnect(async () => {
      await this.admin.connect();
      await this.ensureTopicExists();
    }, 'admin');

    await this.retryConnect(async () => {
      await this.producer.connect();
    }, 'producer');

    await this.retryConnect(async () => {
      await this.consumer.connect();
      await this.consumer.subscribe({ topic: this.PRICE_UPDATES_TOPIC, fromBeginning: true });
    }, 'consumer');
  }

  async onModuleDestroy() {
    await Promise.all([
      this.producer.disconnect(),
      this.consumer.disconnect(),
      this.admin.disconnect()
    ]);
  }

  async notifyPriceChange(symbol: string, oldPrice: number, newPrice: number, userId: number) {
    const percentageChange = ((newPrice - oldPrice) / oldPrice) * 100;
    
    // Only notify if the price change is significant
    if (Math.abs(percentageChange) >= this.SIGNIFICANT_CHANGE_THRESHOLD) {
      const message = {
        userId,
        symbol,
        oldPrice,
        newPrice,
        percentageChange,
        timestamp: new Date().toISOString(),
      };

      try {
        await this.producer.send({
          topic: this.PRICE_UPDATES_TOPIC,
          messages: [{ value: JSON.stringify(message) }],
        });
      } catch (error) {
        console.error('Error sending price change notification:', error);
        // Don't throw the error as this is not critical for the application
      }
    }
  }

  async startNotificationConsumer(callback: (notification: any) => void) {
    try {
      await this.consumer.run({
        eachMessage: async ({ message }) => {
          if (message.value) {
            const notification = JSON.parse(message.value.toString());
            callback(notification);
          }
        },
      });
    } catch (error) {
      console.error('Error running consumer:', error);
      // Attempt to reconnect
      await this.retryConnect(async () => {
        await this.consumer.connect();
        await this.consumer.subscribe({ topic: this.PRICE_UPDATES_TOPIC, fromBeginning: true });
      }, 'consumer');
      await this.startNotificationConsumer(callback);
    }
  }

  async stopNotificationConsumer() {
    await this.consumer.stop();
  }
} 