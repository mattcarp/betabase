import { DataTypes, QueryTypes } from 'sequelize';
import moment from 'moment';

import db from './index';
import * as stream from 'stream';

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
  const [{ dataValues }] = await Round.findAll({
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
    where: {
      currentFlag: true,
      app: app,
    },
  });
  return dataValues;
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

export const getFailCount = async (app: string) => {
  const today = moment().format('Y-m-d h:m:s');
  const query = "SELECT COUNT( t.id ) AS failCount\n" +
  "FROM `round` r, `test` t, `scenario` s\n" +
  "WHERE '" + today + "'\n" +
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
    "WHERE t.created_at BETWEEN r.starts_at AND DATE_ADD(r.release_date, INTERVAL 10 DAY)\n" +
    "AND r.current_flag = TRUE\n" +
    "AND s.id = t.scenario_id\n" +
    "AND s.app_under_test = '" + app + "'\n" +
    "AND r.app  = '" + app + "'\n" +
    "AND t.ticket != ''\n" +
    "GROUP BY t.ticket\n" +
    "ORDER BY t.ticket DESC";
  const result = await db.sequelize.query(query, { type: QueryTypes.SELECT, camelCase: true });
  return db.snakeCaseToCamelCase(result);
}

db.Round = Round;
