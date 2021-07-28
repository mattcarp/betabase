import { DataTypes, QueryTypes } from 'sequelize';

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

export const getEnhancementScenarios = async (app: string) => {
  const query = "SELECT s.id, s.name, s.coverage, s.app_under_test AS appUnderTest,\n" +
    "t.created_at AS mostRecent, t.pass_fail AS lastTest,\n" +
    "s.enhancement_sort_order AS enhancementSortOrder\n" +
    "FROM `scenario` s\n" +
    "LEFT JOIN `test` t ON s.id = t.scenario_id\n" +
    "AND t.created_at = (SELECT max(created_at) FROM `test`\n" +
    "WHERE scenario_id = s.id)\n" +
    "WHERE s.app_under_test = '" + app + "'\n" +
    "AND s.coverage = 'New Enhancements'\n" +
    "AND s.client_priority != TRUE\n" +
    "OR s.client_priority = NULL\n" +
    "ORDER BY s.enhancement_sort_order ASC";
  const result = await db.sequelize.query(query, { type: QueryTypes.SELECT });
  return result;
}

export const getRegressionScenarios = async (app: string) => {
  const query = "SELECT s.id, s.name, s.coverage,\n" +
    "s.app_under_test AS appUnderTest,\n" +
    "t.created_at as mostRecent,\n" +
    "t.pass_fail AS lastTest\n" +
    "FROM `scenario` s LEFT JOIN `test` t on s.id = t.scenario_id\n" +
    "AND t.created_at = (SELECT max(created_at) FROM `test`\n" +
    "WHERE scenario_id = s.id)\n" +
    "WHERE s.app_under_test = '" + app + "'\n" +
    "AND s.client_priority != TRUE\n" +
    "AND s.coverage = 'Regression - Current Round'\n" +
    "GROUP BY s.id\n" +
    "ORDER BY t.created_at ASC";
  const result = await db.sequelize.query(query, { type: QueryTypes.SELECT });
  return result;
}

//getPriorities
// SELECT s.id, s.name, s.coverage,
//   s.app_under_test,
//   t.created_at as most_recent,
//   t.pass_fail AS last_test
// FROM Scenario s LEFT JOIN Test t on s.id = t.scenario_id
// AND t.created_at = (SELECT max(created_at) FROM Test
// WHERE scenario_id = s.id)
// WHERE s.app_under_test = :app
// AND s.client_priority = TRUE
// GROUP BY s.id
// ORDER BY t.created_at ASC

export const getPriorities = async (app: string) => {
  const query = "SELECT s.id, s.name, s.coverage,\n" +
    "s.app_under_test AS appUnderTest,\n" +
    "t.created_at as mostRecent,\n" +
    "t.pass_fail AS lastTest\n" +
    "FROM `scenario` s LEFT JOIN `test` t on s.id = t.scenario_id\n" +
    "AND t.created_at = (SELECT max(created_at) FROM `test`\n" +
    "WHERE scenario_id = s.id)\n" +
    "WHERE s.app_under_test = '" + app + "'\n" +
    "AND s.client_priority = TRUE\n" +
    "GROUP BY s.id\n" +
    "ORDER BY t.created_at ASC";
  const result = await db.sequelize.query(query, { type: QueryTypes.SELECT });
  return result;
}

db.Scenario = Scenario;
