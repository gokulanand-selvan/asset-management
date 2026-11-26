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
import type { AssetCategory } from './AssetCategory';
import type { Employee } from './Employee';
import type { AssetTransaction } from './AssetTransaction';

export type AssetStatus = 'in_stock' | 'issued' | 'scrapped';

export class Asset extends Model<
  InferAttributes<Asset>,
  InferCreationAttributes<Asset>
> {
  declare id: CreationOptional<number>;
  declare assetTag: string;
  declare serialNumber: string;
  declare categoryId: ForeignKey<AssetCategory['id']>;
  declare branch: string;
  declare make: string;
  declare model: string;
  declare purchaseDate: string;
  declare purchaseCost: string | number;
  declare warrantyExpiry: CreationOptional<string | null>;
  declare status: CreationOptional<AssetStatus>;
  declare currentEmployeeId: CreationOptional<ForeignKey<Employee['id']> | null>;
  declare notes: CreationOptional<string | null>;
  declare scrappedAt: CreationOptional<string | null>;
  declare scrapReason: CreationOptional<string | null>;
  declare scrapValue: CreationOptional<string | number | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare category?: NonAttribute<AssetCategory>;
  declare currentEmployee?: NonAttribute<Employee | null>;
  declare transactions?: NonAttribute<AssetTransaction[]>;
}

Asset.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    assetTag: {
      type: DataTypes.STRING(40),
      allowNull: false,
      unique: true,
    },
    serialNumber: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    branch: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    make: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    model: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    purchaseDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    purchaseCost: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    warrantyExpiry: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('in_stock', 'issued', 'scrapped'),
      allowNull: false,
      defaultValue: 'in_stock',
    },
    currentEmployeeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    scrappedAt: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    scrapReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    scrapValue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'assets',
    timestamps: true,
  }
);

export default Asset;
