import { Column, Model, Table, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from '../../users/entities/user.entity';

@Table({
  tableName: 'portfolios',
  timestamps: true,
})
export class Portfolio extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  symbol: string;

  @Column({
    type: DataType.DECIMAL(18, 8),
    allowNull: false,
  })
  quantity: string;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: true,
  })
  currentPrice: number;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: true,
  })
  totalValue: number;
} 