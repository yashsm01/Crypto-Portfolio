import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer, Consumer, logLevel } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly kafka: Kafka;
  private readonly producer: Producer;
  private readonly consumer: Consumer;
  private readonly SIGNIFICANT_CHANGE_THRESHOLD = 0.2; // 5%
  private readonly PRICE_UPDATES_TOPIC = 'crypto-price-updates';
  private readonly SIGNIFICANT_CHANGES_TOPIC = 'significant-price-changes';
  private readonly MAX_RETRIES = 5;
  private readonly INITIAL_RETRY_DELAY = 1000;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'crypto-portfolio',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      retry: {
        initialRetryTime: 100,
        retries: 8
      },
      logLevel: logLevel.ERROR
    });

    this.producer = this.kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000
    });

    this.consumer = this.kafka.consumer({
      groupId: 'crypto-portfolio-group',
      maxWaitTimeInMs: 50,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });
  }

  async onModuleInit() {
    try {
      await this.connectWithRetry();
      await this.ensureTopicsExist();
    } catch (error) {
      console.error('Failed to initialize Kafka service:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await Promise.all([
        this.producer.disconnect(),
        this.consumer.disconnect()
      ]);
    } catch (error) {
      console.error('Error disconnecting from Kafka:', error);
    }
  }

  private async connectWithRetry(retryCount = 0) {
    try {
      await Promise.all([
        this.producer.connect(),
        this.consumer.connect()
      ]);
      console.log('Successfully connected to Kafka');
    } catch (error) {
      if (retryCount < this.MAX_RETRIES) {
        const delay = Math.min(
          this.INITIAL_RETRY_DELAY * Math.pow(2, retryCount),
          30000
        );
        console.log(`Retrying Kafka connection in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.connectWithRetry(retryCount + 1);
      }
      throw error;
    }
  }

  private async ensureTopicsExist() {
    const admin = this.kafka.admin();
    try {
      await admin.connect();
      const topics = await admin.listTopics();
      
      const topicsToCreate = [
        this.PRICE_UPDATES_TOPIC,
        this.SIGNIFICANT_CHANGES_TOPIC
      ].filter(topic => !topics.includes(topic));

      if (topicsToCreate.length > 0) {
        await admin.createTopics({
          topics: topicsToCreate.map(topic => ({
            topic,
            numPartitions: 1,
            replicationFactor: 1
          }))
        });
        console.log('Created Kafka topics:', topicsToCreate);
      }
    } finally {
      await admin.disconnect();
    }
  }

  async notifyPriceChange(symbol: string, oldPrice: number, newPrice: number, userId: number) {
    const percentageChange = ((newPrice - oldPrice) / oldPrice) * 100;
    
    const message = {
      userId,
      symbol,
      oldPrice,
      newPrice,
      percentageChange,
      timestamp: new Date().toISOString(),
      isSignificant: Math.abs(percentageChange) >= this.SIGNIFICANT_CHANGE_THRESHOLD
    };

    try {
      const messages = [{
        key: symbol,
        value: JSON.stringify(message),
        headers: {
          userId: userId.toString(),
          timestamp: new Date().getTime().toString()
        }
      }];

      await this.producer.send({
        topic: this.PRICE_UPDATES_TOPIC,
        messages
      });

      if (message.isSignificant) {
        await this.producer.send({
          topic: this.SIGNIFICANT_CHANGES_TOPIC,
          messages
        });
      }

      console.log(`Price update sent for ${symbol}: ${percentageChange.toFixed(2)}% change`);
    } catch (error) {
      console.error('Error sending price change notification:', error);
      // Don't throw the error as this is not critical for the application
    }
  }

  async startNotificationConsumer(callback: (notification: any) => void) {
    try {
      await this.consumer.subscribe({
        topics: [this.PRICE_UPDATES_TOPIC, this.SIGNIFICANT_CHANGES_TOPIC],
        fromBeginning: false
      });

      await this.consumer.run({
        eachMessage: async ({ topic, message }) => {
          try {
            const notification = JSON.parse(message.value.toString());
            callback(notification);
          } catch (error) {
            console.error('Error processing Kafka message:', error);
          }
        }
      });
    } catch (error) {
      console.error('Error starting Kafka consumer:', error);
      throw error;
    }
  }
}