import sequelize from '../config/database';
import Employee from './Employee';
import AssetCategory from './AssetCategory';
import Asset from './Asset';
import AssetTransaction from './AssetTransaction';

AssetCategory.hasMany(Asset, { foreignKey: 'categoryId', as: 'assets' });
Asset.belongsTo(AssetCategory, { foreignKey: 'categoryId', as: 'category' });

Employee.hasMany(Asset, { foreignKey: 'currentEmployeeId', as: 'heldAssets' });
Asset.belongsTo(Employee, { foreignKey: 'currentEmployeeId', as: 'currentEmployee' });

Asset.hasMany(AssetTransaction, { foreignKey: 'assetId', as: 'transactions' });
AssetTransaction.belongsTo(Asset, { foreignKey: 'assetId', as: 'asset' });

Employee.hasMany(AssetTransaction, { foreignKey: 'employeeId', as: 'transactions' });
AssetTransaction.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

export { sequelize, Employee, AssetCategory, Asset, AssetTransaction };
