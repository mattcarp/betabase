import { DataTypes } from 'sequelize';

import db from './index';

export const Test = db.sequelize.define('Test', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at',
  },
  deploymentStamp: {
    type: DataTypes.DATE,
    field: 'deployment_stamp',
  },
  comments: {
    type: DataTypes.TEXT,
    nullable: true,
  },
  ticket: {
    type: DataTypes.STRING,
    length: 255,
    nullable: true,
  },
  inProd: {
    type: DataTypes.STRING,
    length: 255,
    nullable: true,
    field: 'in_prod',
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
  input: {
    type: DataTypes.TEXT,
    nullable: true,
  },
  result: {
    type: DataTypes.TEXT,
    nullable: true,
  },
  passFail: {
    type: DataTypes.STRING,
    length: 32,
    nullable: true,
    field: 'pass_fail',
  },
  build: {
    type: DataTypes.STRING,
    length: 127,
    nullable: true,
  },
  path: {
    type: DataTypes.STRING,
    length: 255,
    nullable: true,
  },
  browserName: {
    type: DataTypes.STRING,
    length: 255,
    nullable: true,
    field: 'browser_name',
  },
  browserMajor: {
    type: DataTypes.STRING,
    length: 255,
    nullable: true,
    field: 'browser_major',
  },
  browserMinor: {
    type: DataTypes.STRING,
    length: 255,
    nullable: true,
    field: 'browser_minor',
  },
  osName: {
    type: DataTypes.STRING,
    length: 255,
    nullable: true,
    field: 'os_name',
  },
  osMajor: {
    type: DataTypes.STRING,
    length: 255,
    nullable: true,
    field: 'os_major',
  },
  osMinor: {
    type: DataTypes.STRING,
    length: 255,
    nullable: true,
    field: 'os_minor',
  },
}, {
  freezeTableName: true,
  tableName: 'test',
});

Test.hasOne(db.Scenario, {
  foreignKey: {
    name: 'id',
  },
  name: 'scenario_id',
});

export const getAllTests = async () => {
  return await Test.findAll({
    include: db.Scenario,
  });
}

db.Test = Test;
