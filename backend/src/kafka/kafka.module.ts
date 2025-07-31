import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { KafkaController } from './kafka.controller';

@Module({
  providers: [KafkaService],
  exports: [KafkaService],
  controllers: [KafkaController],
})
export class KafkaModule {}