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

export type EmployeeStatus = 'active' | 'inactive';

export class Employee extends Model<
  InferAttributes<Employee>,
  InferCreationAttributes<Employee>
> {
  declare id: CreationOptional<number>;
  declare employeeCode: string;
  declare firstName: string;
  declare lastName: string;
  declare email: string;
  declare phone: CreationOptional<string | null>;
  declare department: string;
  declare designation: CreationOptional<string | null>;
  declare branch: string;
  declare status: CreationOptional<EmployeeStatus>;
  declare joinedDate: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare heldAssets?: NonAttribute<Asset[]>;

  get fullName(): NonAttribute<string> {
    return `${this.firstName} ${this.lastName}`.trim();
  }
}

Employee.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employeeCode: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    firstName: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    designation: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    branch: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    },
    joinedDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'employees',
    timestamps: true,
  }
);

export default Employee;
