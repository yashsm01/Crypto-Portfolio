import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly CACHE_TTL = 60; // Cache for 60 seconds

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  async getCachedPrice(symbol: string): Promise<number | null> {
    const cachedPrice = await this.redis.get(`price:${symbol}`);
    return cachedPrice ? parseFloat(cachedPrice) : null;
  }

  async setCachedPrice(symbol: string, price: number): Promise<void> {
    await this.redis.setex(`price:${symbol}`, this.CACHE_TTL, price.toString());
  }

  async publishPriceUpdate(symbol: string, price: number): Promise<void> {
    await this.redis.publish('price-updates', JSON.stringify({ symbol, price }));
  }

  async subscribeToPriceUpdates(callback: (symbol: string, price: number) => void): Promise<void> {
    const subscriber = this.redis.duplicate();
    await subscriber.subscribe('price-updates');
    
    subscriber.on('message', (channel, message) => {
      if (channel === 'price-updates') {
        const { symbol, price } = JSON.parse(message);
        callback(symbol, price);
      }
    });
  }
} 