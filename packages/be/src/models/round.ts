import { DataTypes, QueryTypes } from 'sequelize';
import * as moment from 'moment';

import db from './index';

export const Round = db.sequelize.define('Round', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  currentFlag: {
    type: DataTypes.BOOLEAN,
    field: 'current_flag',
    nullable: true,
  },
  app: {
    type: DataTypes.STRING,
    length: 255,
  },
  notes: {
    type: DataTypes.TEXT,
    nullable: true,
  },
  clientNotes: {
    type: DataTypes.TEXT,
    nullable: true,
    field: 'client_notes',
  },
  name: {
    type: DataTypes.STRING,
    length: 255,
  },
  startsAt: {
    type: DataTypes.DATE,
    field: 'starts_at',
  },
  endsAt: {
    type: DataTypes.DATE,
    field: 'ends_at',
  },
  releaseDate: {
    type: DataTypes.DATE,
    field: 'release_date',
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at',
  },
  releaseNum: {
    type: DataTypes.STRING,
    length: 255,
    nullable: true,
    field: 'release_num',
  },
}, {
  freezeTableName: true,
  tableName: 'round',
});

export const getRoundNotes = async (app: string) => {
  const response = await Round.findAll({
    attributes: [
      'notes',
      'clientNotes',
      'app',
      'startsAt',
      'endsAt',
      'name',
      'releaseNum',
      'releaseDate',
    ],
    where: { app },
    order: [
      ['id', 'DESC'],
    ],
  });
  return response?.[0]?.dataValues;
}

export const getTestCount = async (app: string) => {
  const query = "SELECT COUNT(t.id) AS testCount\n" +
    "FROM `round` r, `test` t, `scenario` s\n" +
    "WHERE t.updated_at BETWEEN r.starts_at AND r.ends_at\n" +
    "AND s.id = t.scenario_id\n" +
    "AND s.app_under_test = '" + app + "'\n" +
    "AND r.app  = '" + app + "'";
  const [{ testCount }] = await db.sequelize.query(query, { type: QueryTypes.SELECT });
  return testCount;
}

export const getFailCount = async (app: string) => {
  const today = moment().format('Y-M-D');
  const query = "SELECT COUNT( t.id ) AS failCount\n" +
  "FROM `round` r, `test` t, `scenario` s\n" +
  "WHERE '" + today + " 0:0:0'\n" +
  "BETWEEN r.starts_at AND r.ends_at\n" +
  "AND t.updated_at\n" +
  "BETWEEN r.starts_at AND r.ends_at\n" +
  "AND s.id = t.scenario_id\n" +
  "AND s.app_under_test = '" + app + "'\n" +
  "AND r.app = '" + app + "'\n" +
  "AND t.pass_fail = 'Fail'";
  const [{ failCount }] = await db.sequelize.query(query, { type: QueryTypes.SELECT });
  return failCount;
}

export const getJiras = async (app: string) => {
  const query = "SELECT t.*, s.is_security\n" +
    "FROM `round` r, `test` t, `scenario` s\n" +
    // "WHERE t.created_at BETWEEN r.starts_at AND DATE_ADD(r.release_date, INTERVAL 10 DAY)\n" +
    // "AND r.current_flag = TRUE\n" +
    "WHERE r.current_flag = TRUE\n" +
    "AND s.id = t.scenario_id\n" +
    "AND s.app_under_test = '" + app + "'\n" +
    // "AND r.app  = '" + app + "'\n" +
    "AND t.ticket != ''\n" +
    "GROUP BY t.ticket\n" +
    "ORDER BY t.ticket DESC";
  const result = await db.sequelize.query(query, { type: QueryTypes.SELECT, camelCase: true });
  return db.snakeCaseToCamelCase(result);
}

export const getRoundList = async (app: string) => {
  const rounds = await Round.findAll({
    attributes: [
      'id',
      'name',
      'startsAt',
      'endsAt',
      'updatedAt',
      'releaseNum',
      'currentFlag',
    ],
    where: { app },
    order: [
      ['updatedAt', 'DESC'],
    ],
  });
  return rounds;
}

export const getRoundById = async (id: string) => {
  try {
    const { dataValues } = await Round.findByPk(id);
    return dataValues;
  } catch (e) {
    return null;
  }
}

export const addRound = async (params) => {
  const model = await Round.create(params);
  await model.save();
  return model?.id;
}

export const updateRound = async (id, params) => {
  try {
    await Round.update({ ...params }, { where: { id }});
    return id;
  } catch (e) {
    return e;
  }
}

export const deleteRound = async (id: string) => {
  try {
    await Round.destroy({ where: { id }});
    return `Round ${id} has been successfully deleted`;
  } catch (e) {
    return e;
  }
}

db.Round = Round;
