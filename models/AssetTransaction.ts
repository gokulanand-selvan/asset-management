import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from 'sequelize';
import sequelize from '../config/database';
import type { Asset } from './Asset';
import type { Employee } from './Employee';

export type TransactionActionType =
  | 'PURCHASED'
  | 'ISSUED'
  | 'RETURNED'
  | 'SCRAPPED';

export class AssetTransaction extends Model<
  InferAttributes<AssetTransaction>,
  InferCreationAttributes<AssetTransaction>
> {
  declare id: CreationOptional<number>;
  declare assetId: ForeignKey<Asset['id']>;
  declare employeeId: CreationOptional<ForeignKey<Employee['id']> | null>;
  declare branch: CreationOptional<string | null>;
  declare actionType: TransactionActionType;
  declare transactionDate: string;
  declare reason: CreationOptional<string | null>;
  declare condition: CreationOptional<string | null>;
  declare costImpact: CreationOptional<string | number>;
  declare remarks: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare asset?: NonAttribute<Asset>;
  declare employee?: NonAttribute<Employee | null>;
}

AssetTransaction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    assetId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    branch: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    actionType: {
      type: DataTypes.ENUM('PURCHASED', 'ISSUED', 'RETURNED', 'SCRAPPED'),
      allowNull: false,
    },
    transactionDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    condition: {
      type: DataTypes.STRING(60),
      allowNull: true,
    },
    costImpact: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'asset_transactions',
    timestamps: true,
  }
);

export default AssetTransaction;
