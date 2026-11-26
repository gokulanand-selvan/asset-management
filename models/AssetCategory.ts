import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from 'sequelize';
import sequelize from '../config/database';
import type { Asset } from './Asset';

export class AssetCategory extends Model<
  InferAttributes<AssetCategory>,
  InferCreationAttributes<AssetCategory>
> {
  declare id: CreationOptional<number>;
  declare code: string;
  declare name: string;
  declare description: CreationOptional<string | null>;
  declare isActive: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare assets?: NonAttribute<Asset[]>;
}

AssetCategory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'asset_categories',
    timestamps: true,
  }
);

export default AssetCategory;
