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

export const getEnhancementCount = async (app: string) => {
  const query = "SELECT COUNT(s.id) as enhancementCount\n" +
    "FROM `scenario` s\n" +
    "LEFT JOIN `test` t ON s.id = t.scenario_id\n" +
    "AND t.created_at = (SELECT max(created_at) FROM `test`\n" +
    "WHERE scenario_id = s.id)\n" +
    "WHERE s.app_under_test = '" + app + "'\n" +
    "AND s.coverage = 'New Enhancements'\n" +
    "AND s.client_priority != TRUE\n" +
    "OR s.client_priority = NULL";
  const [{ enhancementCount }] = await db.sequelize.query(query, { type: QueryTypes.SELECT });
  return enhancementCount;
}

export const getRegressionCount = async (app: string) => {
  const query = "SELECT COUNT(s.id) as regressionCount\n" +
    "FROM `scenario` s\n" +
    "LEFT JOIN `test` t ON s.id = t.scenario_id\n" +
    "AND t.created_at = (SELECT max(created_at) FROM `test`\n" +
    "WHERE scenario_id = s.id)\n" +
    "WHERE s.app_under_test = '" + app + "'\n" +
    "AND s.coverage = 'Regression - Current Round'\n" +
    "AND s.client_priority != TRUE\n" +
    "OR s.client_priority = NULL";
  const [{ regressionCount }] = await db.sequelize.query(query, { type: QueryTypes.SELECT });
  return regressionCount;
}

export const getPriorityCount = async (app: string) => {
  const query = "SELECT COUNT(s.id) as priorityCount\n" +
    "FROM `scenario` s\n" +
    "LEFT JOIN `test` t ON s.id = t.scenario_id\n" +
    "AND t.created_at = (SELECT max(created_at) FROM `test`\n" +
    "WHERE scenario_id = s.id)\n" +
    "WHERE s.app_under_test = '" + app + "'\n" +
    "AND s.client_priority = TRUE";
  const [{ priorityCount }] = await db.sequelize.query(query, { type: QueryTypes.SELECT });
  return priorityCount;
}

export const getFlaggedCount = async (app: string) => {
  const query = "SELECT COUNT(s.id) as flaggedCount\n" +
    "FROM `scenario` s\n" +
    "LEFT JOIN `test` t ON s.id = t.scenario_id\n" +
    "AND t.created_at = (SELECT max(created_at) FROM `test`\n" +
    "WHERE scenario_id = s.id)\n" +
    "WHERE s.app_under_test = '" + app + "'\n" +
    "AND s.review_flag = '1'";
  const [{ flaggedCount }] = await db.sequelize.query(query, { type: QueryTypes.SELECT });
  return flaggedCount;
}

export const getFlaggedScenarios = async (app: string) => {
  const query = "SELECT s.*\n" +
    "FROM `scenario` s\n" +
    "LEFT JOIN `test` t ON s.id = t.scenario_id\n" +
    "AND t.created_at = (SELECT max(created_at) FROM `test`\n" +
    "WHERE scenario_id = s.id)\n" +
    "WHERE s.app_under_test = '" + app + "'\n" +
    "AND s.review_flag = '1'";
  const result = await db.sequelize.query(query, { type: QueryTypes.SELECT });
  return db.snakeCaseToCamelCase(result);
}

export const getPriorityScenarios = async (app: string) => {
  const query = "SELECT s.id, s.name, s.coverage,\n" +
    "s.app_under_test,\n" +
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
  return db.snakeCaseToCamelCase(result);
}

export const getScenario = async (id: string) => {
  const { dataValues } = await Scenario.findByPk(id);
  return dataValues;
}

export const getScenarioList = async (appUnderTest: string) => {
  const result = await Scenario.findAll({
    where: { appUnderTest },
    order: [
      ['updatedAt', 'DESC'],
    ],
  });
  return result;
}

export const createScenario = async (params) => {
  const model = await Scenario.create(params);
  await model.save();
  return model;
}

export const updateScenario = async (id, params) => {
  try {
    await Scenario.update({ ...params }, { where: { id }});
    return id;
  } catch (e) {
    return e;
  }
}

db.Scenario = Scenario;
