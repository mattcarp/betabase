import { DataTypes, Op, QueryTypes } from 'sequelize';
import * as moment from 'moment';

import db from './index';
import { getCurrentRoundDates, getRoundNotes } from './round';

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
  let result = [];
  const round = await getRoundNotes(app);
  if (round?.hasOwnProperty('startsAt') && round?.hasOwnProperty('endsAt')) {
    const { startsAt, endsAt } = round;
    const scenarioItems = await db.Scenario.findAll({
      attributes: ['id'],
      where: {
        appUnderTest: app,
        createdAt: {
          [Op.between]: [
            moment(String(startsAt), 'YYYY-MM-DD').format('YYYY-MM-DD'),
            moment(String(endsAt), 'YYYY-MM-DD').format('YYYY-MM-DD'),
          ],
        },
      },
    });
    const scenarioIds = scenarioItems?.map(({ dataValues }) => dataValues)?.map(({ id }) => id);
    if (scenarioIds?.length) {
      result = await Test.findAll({
        where: {
          scenarioId: {
            [Op.in]: scenarioIds,
          },
        },
      });
    }
  }
  return result?.map(({ dataValues }) => dataValues);
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
  const query = "SELECT COUNT(t.id) AS count\n" +
    "FROM test t, scenario s\n" +
    "WHERE t.created_at BETWEEN '" + start + " 0:00' AND '" + end + " 23:59'\n" +
    "AND s.id = t.scenario_id\n" +
    "AND LOWER(s.app_under_test) = LOWER('" + app + "')";
  const [{ count }] = await db.sequelize.query(query, { type: QueryTypes.SELECT });
  return count;
}

export const getTestCount = async (app: string) => {
  const { startsAt, endsAt } = await getCurrentRoundDates(app);
  const query = "SELECT COUNT(t.id) AS count\n" +
    "FROM round r, test t, scenario s\n" +
    "WHERE r.current_flag = TRUE\n" +
    "AND DATE(t.updated_at) BETWEEN DATE('" + startsAt + "') AND DATE('" + endsAt + "')\n" +
    "AND s.id = t.scenario_id\n" +
    "AND LOWER(s.app_under_test) = LOWER('" + app + "')\n" +
    "AND r.app  = '" + app + "'";
  const [{ count }] = await db.sequelize.query(query, { type: QueryTypes.SELECT });
  return count;
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

export const addTest = async (params, createdBy: string) => {
  const model = await Test.create({ ...params, createdBy });
  await model.save();
  return model;
}

export const getTest = async (id: string) => {
  const { dataValues } = await Test.findByPk(id);
  return dataValues;
}

export const updateTest = async (id, params, updatedBy: string) => {
  await Test.update({ ...params, updatedBy }, { where: { id }});
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
