import { IsNotEmpty, IsString, Matches, IsNumberString } from 'class-validator';
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
    description: 'Quantity of cryptocurrency (as string, up to 8 decimal places)',
    example: '0.12345678',
    pattern: '^[0-9]+\.?[0-9]*$',
  })
  @IsNotEmpty()
  @IsNumberString()
  @Matches(/^[0-9]+\.?[0-9]*$/, {
    message: 'Quantity must be a valid number with optional decimal places',
  })
  quantity: string;
} 