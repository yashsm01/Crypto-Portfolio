import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Portfolio } from './entities/portfolio.entity';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import axios from 'axios';

@Injectable()
export class PortfolioService {
  private priceCache: Map<string, { price: number; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 60 * 1000; // 1 minute cache
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY = 1000; // 1 second

  constructor(
    @InjectModel(Portfolio)
    private portfolioModel: typeof Portfolio,
  ) {}

  async create(createPortfolioDto: CreatePortfolioDto, userId: number): Promise<Portfolio> {
    const price = await this.getCryptoPrice(createPortfolioDto.symbol);
    const totalValue = price * createPortfolioDto.quantity;

    return this.portfolioModel.create({
      ...createPortfolioDto,
      userId,
      currentPrice: price,
      totalValue,
      quantity: createPortfolioDto.quantity.toFixed(8),
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
          const price = await this.getCryptoPrice(portfolio.symbol);
          const totalValue = price * parseFloat(portfolio.quantity);
          
          await portfolio.update({
            currentPrice: price,
            totalValue,
          });
          
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
    // Check cache first
    const cachedData = this.priceCache.get(symbol);
    if (cachedData && Date.now() - cachedData.timestamp < this.CACHE_DURATION) {
      return cachedData.price;
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
      
      // Update cache
      this.priceCache.set(symbol, {
        price,
        timestamp: Date.now(),
      });

      return price;
    } catch (error) {
      if (error.response?.status === 429 && retryCount < this.MAX_RETRIES) {
        const retryAfter = parseInt(error.response.headers['retry-after']) || 
          Math.pow(2, retryCount) * this.INITIAL_RETRY_DELAY;
        
        console.log(`Rate limited, retrying after ${retryAfter}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter));
        
        return this.fetchCryptoPriceWithRetry(symbol, retryCount + 1);
      }

      // If we have cached data, return it even if expired
      const cachedData = this.priceCache.get(symbol);
      if (cachedData) {
        console.log(`Using expired cache for ${symbol} due to API error`);
        return cachedData.price;
      }

      throw new Error(`Unable to fetch price for ${symbol}`);
    }
  }

  private getCoingeckoId(symbol: string): string {
    // Map common symbols to CoinGecko IDs
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
      // Add more mappings as needed
    };

    return symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
  }
} 