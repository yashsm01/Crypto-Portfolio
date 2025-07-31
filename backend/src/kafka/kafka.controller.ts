import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

class TestPriceUpdateDto {
  @ApiProperty({ example: 'BTC', description: 'Cryptocurrency symbol' })
  @IsString()
  @IsNotEmpty()
  symbol: string;

  @ApiProperty({ example: 50000, description: 'New price for the cryptocurrency' })
  @IsNumber()
  @IsNotEmpty()
  newPrice: number;

  @ApiProperty({ example: 1, description: 'User ID' })
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}

@ApiTags('Kafka Test')
@Controller('kafka-test')
@ApiBearerAuth('JWT-auth')
export class KafkaController {
  constructor(private readonly kafkaService: KafkaService) {}

  @Post('trigger-price-update')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Trigger a test price update',
    description: 'Triggers a test price update with a random price change'
  })
  @ApiBody({ 
    type: TestPriceUpdateDto,
    description: 'Price update test data'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Price update triggered successfully',
    schema: {
      example: {
        message: 'Price update triggered',
        details: {
          symbol: 'BTC',
          oldPrice: 48000,
          newPrice: 50000,
          percentageChange: 4.17
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async triggerPriceUpdate(@Body() data: TestPriceUpdateDto) {
    const oldPrice = data.newPrice * (1 - Math.random() * 0.5);
    await this.kafkaService.notifyPriceChange(
      data.symbol,
      oldPrice,
      data.newPrice,
      data.userId
    );
    return {
      message: 'Price update triggered',
      details: {
        symbol: data.symbol,
        oldPrice,
        newPrice: data.newPrice,
        percentageChange: ((data.newPrice - oldPrice) / oldPrice) * 100
      }
    };
  }

  @Post('trigger-significant-change')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Trigger a significant price change',
    description: 'Triggers a test price update with a significant change (>20%)'
  })
  @ApiBody({
    type: TestPriceUpdateDto,
    description: 'Significant price change test data'
  })
  @ApiResponse({
    status: 200,
    description: 'Significant price change triggered successfully',
    schema: {
      example: {
        message: 'Significant price change triggered',
        details: {
          symbol: 'BTC',
          oldPrice: 40000,
          newPrice: 50000,
          percentageChange: 25
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async triggerSignificantChange(@Body() data: TestPriceUpdateDto) {
    const oldPrice = data.newPrice / 1.5;
    await this.kafkaService.notifyPriceChange(
      data.symbol,
      oldPrice,
      data.newPrice,
      data.userId
    );
    return {
      message: 'Significant price change triggered',
      details: {
        symbol: data.symbol,
        oldPrice,
        newPrice: data.newPrice,
        percentageChange: 50
      }
    };
  }
}