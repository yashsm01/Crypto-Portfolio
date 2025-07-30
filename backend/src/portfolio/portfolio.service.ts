import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Portfolio } from './entities/portfolio.entity';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { RedisService } from '../cache/redis.service';
import { KafkaService } from '../kafka/kafka.service';
import axios from 'axios';

@Injectable()
export class PortfolioService {
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY = 1000; // 1 second

  constructor(
    @InjectModel(Portfolio)
    private portfolioModel: typeof Portfolio,
    private readonly redisService: RedisService,
    private readonly kafkaService: KafkaService,
  ) {}

  async create(createPortfolioDto: CreatePortfolioDto, userId: number): Promise<Portfolio> {
    // Validate quantity is a positive number
    const quantityNum = parseFloat(createPortfolioDto.quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      throw new Error('Quantity must be a positive number');
    }

    const price = await this.getCryptoPrice(createPortfolioDto.symbol);
    const totalValue = price * quantityNum;

    return this.portfolioModel.create({
      ...createPortfolioDto,
      userId,
      currentPrice: price,
      totalValue,
      quantity: quantityNum.toFixed(8), // Store with 8 decimal places
    });
  }

  async findAll(userId: number): Promise<Portfolio[]> {
    const portfolios = await this.portfolioModel.findAll({
      where: { userId },
    });
    
    // Update prices in batches to avoid rate limits
    const updatedPortfolios = await Promise.all(
      portfolios.map(async (portfolio) => {
        try {
          const oldPrice = portfolio.currentPrice;
          const price = await this.getCryptoPrice(portfolio.symbol);
          const totalValue = price * parseFloat(portfolio.quantity);
          
          await portfolio.update({
            currentPrice: price,
            totalValue,
          });

          // Notify about significant price changes
          await this.kafkaService.notifyPriceChange(
            portfolio.symbol,
            oldPrice,
            price,
            userId
          );
          
          return portfolio;
        } catch (error) {
          console.error(`Error updating ${portfolio.symbol}:`, error);
          return portfolio; // Return existing data if update fails
        }
      })
    );

    return updatedPortfolios;
  }

  async remove(id: number, userId: number): Promise<void> {
    const portfolio = await this.portfolioModel.findOne({
      where: { id, userId },
    });
    
    if (!portfolio) {
      throw new NotFoundException(`Portfolio entry with ID ${id} not found`);
    }
    
    await portfolio.destroy();
  }

  private async getCryptoPrice(symbol: string): Promise<number> {
    // Try to get price from cache first
    const cachedPrice = await this.redisService.getCachedPrice(symbol);
    if (cachedPrice !== null) {
      return cachedPrice;
    }

    // If not in cache, fetch from API with retry logic
    return this.fetchCryptoPriceWithRetry(symbol);
  }

  private async fetchCryptoPriceWithRetry(symbol: string, retryCount = 0): Promise<number> {
    try {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price`,
        {
          params: {
            ids: this.getCoingeckoId(symbol),
            vs_currencies: 'usd',
          },
        }
      );

      const price = response.data[this.getCoingeckoId(symbol)].usd;
      
      // Cache the price
      await this.redisService.setCachedPrice(symbol, price);
      // Publish price update
      await this.redisService.publishPriceUpdate(symbol, price);

      return price;
    } catch (error) {
      if (error.response?.status === 429 && retryCount < this.MAX_RETRIES) {
        const retryAfter = parseInt(error.response.headers['retry-after']) || 
          Math.pow(2, retryCount) * this.INITIAL_RETRY_DELAY;
        
        console.log(`Rate limited, retrying after ${retryAfter}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter));
        
        return this.fetchCryptoPriceWithRetry(symbol, retryCount + 1);
      }

      // Try to get cached price even if expired
      const cachedPrice = await this.redisService.getCachedPrice(symbol);
      if (cachedPrice !== null) {
        console.log(`Using cached price for ${symbol} due to API error`);
        return cachedPrice;
      }

      throw new Error(`Unable to fetch price for ${symbol}`);
    }
  }

  private getCoingeckoId(symbol: string): string {
    const symbolMap = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'USDT': 'tether',
      'BNB': 'binancecoin',
      'SOL': 'solana',
      'ADA': 'cardano',
      'XRP': 'ripple',
      'DOGE': 'dogecoin',
      'DOT': 'polkadot',
      'MATIC': 'matic-network',
      'PEPE': 'pepe',
    };

    return symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
  }
} 