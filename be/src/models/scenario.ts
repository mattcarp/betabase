import { DataTypes } from 'sequelize';

import db from './index';

export const Scenario = db.sequelize.define('Scenario', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    length: 255,
  },
  script: {
    type: DataTypes.TEXT,
    nullable: true,
  },
  expectedResult: {
    type: DataTypes.TEXT,
    nullable: true,
    field: 'expected_result',
  },
  createdBy: {
    type: DataTypes.STRING,
    length: 127,
    field: 'created_by',
  },
  updatedBy: {
    type: DataTypes.STRING,
    length: 127,
    nullable: true,
    field: 'updated_by',
  },
  preconditions: {
    type: DataTypes.TEXT,
    nullable: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at',
  },
  reviewFlag: {
    type: DataTypes.BOOLEAN,
    field: 'review_flag',
    nullable: true,
  },
  isSecurity: {
    type: DataTypes.BOOLEAN,
    field: 'is_security',
    nullable: true,
  },
  clientPriority: {
    type: DataTypes.BOOLEAN,
    field: 'client_priority',
    nullable: true,
  },
  flagReason: {
    type: DataTypes.TEXT,
    nullable: true,
    field: 'flag_reason',
  },
  appUnderTest: {
    type: DataTypes.STRING,
    length: 255,
    nullable: true,
    field: 'app_under_test',
  },
  mode: {
    type: DataTypes.STRING,
    length: 255,
    nullable: true,
  },
  tags: {
    type: DataTypes.STRING,
    length: 255,
    nullable: true,
  },
  coverage: {
    type: DataTypes.STRING,
    length: 128,
  },
  prioritySortOrder: {
    type: DataTypes.INTEGER,
    field: 'priority_sort_order',
    nullable: true,
  },
  enhancementSortOrder: {
    type: DataTypes.INTEGER,
    field: 'enhancement_sort_order',
    nullable: true,
  },
  currentRegressionSortOrder: {
    type: DataTypes.INTEGER,
    field: 'current_regression_sort_order',
    nullable: true,
  },
}, {
  freezeTableName: true,
  tableName: 'scenario',
});

export const getScenarioCount = async (app: string) => {
  const [{ dataValues }] = await Scenario.findAll({
    attributes: [
      [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'scenarioCount'],
    ],
    where: {
      appUnderTest: app,
    },
  });
  return dataValues;
}

db.Scenario = Scenario;
