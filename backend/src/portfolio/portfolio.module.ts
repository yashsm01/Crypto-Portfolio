import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PortfolioService } from './portfolio.service';
import { PortfolioController } from './portfolio.controller';
import { Portfolio } from './entities/portfolio.entity';

@Module({
  imports: [SequelizeModule.forFeature([Portfolio])],
  controllers: [PortfolioController],
  providers: [PortfolioService],
})
export class PortfolioModule {} 