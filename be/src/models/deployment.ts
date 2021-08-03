import { DataTypes } from 'sequelize';

import db from './index';

export const Deployment = db.sequelize.define('Deployment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  build: {
    type: DataTypes.STRING,
    length: 255,
  },
  branch: {
    type: DataTypes.STRING,
    length: 255,
  },
  appUnderTest: {
    type: DataTypes.STRING,
    length: 255,
    field: 'app_under_test',
  },
  deployedAt: {
    type: DataTypes.DATE,
    field: 'deployed_at',
  },
  recordInsertedAt: {
    type: DataTypes.DATE,
    field: 'record_inserted_at',
  },
}, {
  freezeTableName: true,
  tableName: 'deployment',
});

export const getDeployment = async (app: string) => {
  const [{ dataValues }] = await Deployment.findAll({
    attributes: [
      'build',
      'branch',
      'deployedAt',
    ],
    where: {
      appUnderTest: app,
    },
    order: [
      ['deployedAt', 'DESC'],
    ],
    limit: 1,
  });
  return dataValues;
}

db.Deployment = Deployment;
