import { DataTypes, QueryTypes } from 'sequelize';
import * as moment from 'moment';

import db from './index';
import { Scenario } from './scenario';

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
  scenarioId: {
    type: DataTypes.NUMBER,
    field: 'scenario_id',
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

export const getTestList = async (app: string) => {
  const query = "SELECT t.created_at, t.updated_at,\n" +
    "t.updated_by, t.pass_fail, t.input, t.result, t.created_by,\n" +
    "t.browser_name, t.browser_major, t.browser_minor,\n" +
    "t.os_name, t.os_major, t.os_minor,\n" +
    "t.ticket, t.scenario_id, t.id, t.deployment_stamp\n" +
    "FROM Test t, Scenario s\n" +
    "WHERE t.scenario_id = s.id\n" +
    "AND s.app_under_test = '" + app + "'\n" +
    "ORDER BY t.updated_at DESC\n" +
    "LIMIT 0, 2000";
  const result = await db.sequelize.query(query, { type: QueryTypes.SELECT });
  return db.snakeCaseToCamelCase(result);
}

export const getTestCountRange = async (app: string, period: string) => {
  let start;
  let end;
  switch (period) {
    case 'today':
      start = moment().startOf('day').format('Y-M-D');
      end = moment().endOf('day').format('Y-M-D');
      break;
    case 'yesterday':
      start = moment().startOf('day').subtract(1, 'days').format('Y-M-D');
      end = moment().endOf('day').subtract(1, 'days').format('Y-M-D');
      break;
    case 'last7days':
      start = moment().startOf('day').subtract(7, 'days').format('Y-M-D');
      end = moment().endOf('day').format('Y-M-D');
      break;
  }
  const query = "SELECT COUNT(t.id) AS testCount\n" +
    "FROM `test` t, `scenario` s\n" +
    "WHERE t.created_at BETWEEN '" + start + "' AND '" + end + "'\n" +
    "AND s.id = t.scenario_id\n" +
    "AND s.app_under_test = '" + app + "'";
  const [{ testCount }] = await db.sequelize.query(query, { type: QueryTypes.SELECT });
  return testCount;
}

export const getTestCount = async (app: string) => {
  const query = "SELECT COUNT(t.id) AS testCount\n" +
    "FROM `round` r, `test` t, `scenario` s\n" +
    "WHERE r.current_flag = TRUE\n" +
    "AND t.updated_at BETWEEN r.starts_at AND r.ends_at\n" +
    "AND s.id = t.scenario_id\n" +
    "AND s.app_under_test = '" + app + "'\n" +
    "AND r.app  = '" + app + "'";
  const [{ testCount }] = await db.sequelize.query(query, { type: QueryTypes.SELECT });
  return testCount;
}

export const getScenarioTests = async (scenario_id: string) => {
  const result = await Test.findAll({
    where: { scenario_id },
    order: [
      ['createdAt', 'DESC'],
    ],
  });
  return result;
}

export const addTest = async (params) => {
  const model = await Test.create(params);
  await model.save();
  return model;
}

export const getTest = async (id: string) => {
  const { dataValues } = await Test.findByPk(id);
  return dataValues;
}

export const updateTest = async (id, params) => {
  await Test.update({ ...params }, { where: { id }});
  return id;
}

export const deleteTest = async (id: string) => {
  try {
    await Test.destroy({ where: { id }});
    return `Test ${id} has been successfully deleted`;
  } catch (e) {
    return e;
  }
}

db.Test = Test;
