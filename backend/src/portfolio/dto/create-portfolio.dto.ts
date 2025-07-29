import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePortfolioDto {
  @ApiProperty({
    description: 'Cryptocurrency symbol (e.g., BTC, ETH)',
    example: 'BTC',
  })
  @IsNotEmpty()
  @IsString()
  symbol: string;

  @ApiProperty({
    description: 'Quantity of cryptocurrency',
    example: 0.5,
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  quantity: number;
} 