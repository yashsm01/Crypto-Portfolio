import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { KafkaService } from '../kafka/kafka.service';

@Module({
  providers: [RedisService, KafkaService],
  exports: [RedisService, KafkaService],
})
export class CacheModule {} 