import { Sequelize } from 'sequelize-typescript';
import { User } from '../users/entities/user.entity';
import { Portfolio } from '../portfolio/entities/portfolio.entity';

export const initializeDatabase = async (sequelize: Sequelize) => {
  sequelize.addModels([User, Portfolio]);

  // Sync all models
  await sequelize.sync({ alter: true });
  console.log('Database synchronized');
}; 