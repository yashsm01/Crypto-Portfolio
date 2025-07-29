import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { PortfolioModule } from './portfolio/portfolio.module';
import { AuthModule } from './auth/auth.module';
import databaseConfig from './config/database.config';
import { User } from './users/entities/user.entity';
import { Portfolio } from './portfolio/entities/portfolio.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
        models: [User, Portfolio],
        autoLoadModels: true,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    PortfolioModule,
    AuthModule,
  ],
})
export class AppModule {}
