const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const { Company } = require('./Company');
const { User } = require('./User');

const Team = sequelize.define('Team', {
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
  owner_company: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Company,
      key: 'id'
    }
  }
}, {
  timestamps: true,
  tableName: 'teams'
});

Team.belongsTo(Company, {
  foreignKey: 'owner_company'
});

const TeamParticipant = sequelize.define('TeamParticipant', {
  team_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: Team,
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
  },
  isManager: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
});

Team.belongsToMany(User, {
  through: TeamParticipant,
  foreignKey: 'team_id',
  otherKey: 'user_id'
});

User.belongsToMany(Team, {
  through: TeamParticipant,
  foreignKey: 'user_id',
  otherKey: 'team_id'
});

module.exports = { Team, TeamParticipant };