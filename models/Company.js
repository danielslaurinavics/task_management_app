const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const { User } = require('./User');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(32),
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'companies'
});

const CompanyManager = sequelize.define('CompanyManager', {
  company_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: Company,
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: User,
      key: 'id'
    }
  }
}, {
  tableName: 'company_managers'
});

Company.belongsToMany(User, {
  through: CompanyManager,
  foreignKey: 'company_id',
  otherKey: 'user_id'
});

User.belongsToMany(Company, {
  through: CompanyManager,
  foreignKey: 'user_id',
  otherKey: 'company_id'
});

module.exports = { Company, CompanyManager }; 