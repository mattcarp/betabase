import { DataTypes, QueryTypes } from 'sequelize';
import * as htmlToPdf from 'html-pdf';

import db from './index';
import { ScenarioItem } from '../../../fe/src/app/shared/models';

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
    type: DataTypes.SMALLINT,
    field: 'review_flag',
    nullable: true,
  },
  isSecurity: {
    type: DataTypes.SMALLINT,
    field: 'is_security',
    nullable: true,
  },
  clientPriority: {
    type: DataTypes.SMALLINT,
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

export const getEnhancementScenarios = async (app: string, startsAt: string, endsAt: string) => {
  const query = "SELECT s.id, s.name, s.coverage, s.app_under_test,\n" +
    "t.created_at AS most_recent, t.pass_fail AS last_test,\n" +
    "s.enhancement_sort_order\n" +
    "FROM scenario s\n" +
    "LEFT JOIN test t ON s.id = t.scenario_id\n" +
    "AND DATE(t.created_at) BETWEEN DATE('" + startsAt + "') AND DATE('" + endsAt + "')\n" +
    "WHERE LOWER(s.app_under_test) = LOWER('" + app + "')\n" +
    "AND s.coverage = 'New Enhancements'\n" +
    "AND t.created_at IS NOT NULL\n" +
    "AND s.client_priority = 0\n" +
    "OR s.client_priority = NULL\n" +
    "ORDER BY s.enhancement_sort_order ASC";
  const result = await db.sequelize.query(query, { type: QueryTypes.SELECT });
  return db.snakeCaseToCamelCase(result);
}

export const getRegressionScenarios = async (app: string, startsAt: string, endsAt: string) => {
  const query = "SELECT s.id, s.name, s.coverage,\n" +
    "s.app_under_test,\n" +
    "t.created_at as most_recent,\n" +
    "t.pass_fail AS last_test\n" +
    "FROM scenario s LEFT JOIN test t on s.id = t.scenario_id\n" +
    "AND DATE(t.created_at) BETWEEN DATE('" + startsAt + "') AND DATE('" + endsAt + "')\n" +
    "WHERE LOWER(s.app_under_test) = LOWER('" + app + "')\n" +
    "AND s.client_priority = 0\n" +
    "AND s.coverage = 'Regression - Current Round'\n" +
    "GROUP BY s.id, s.name, s.coverage, s.app_under_test, most_recent, last_test\n" +
    "ORDER BY t.created_at ASC";
  const result = await db.sequelize.query(query, { type: QueryTypes.SELECT });
  return db.snakeCaseToCamelCase(result);
}

export const getPriorities = async (app: string, startsAt: string, endsAt: string) => {
  const query = "SELECT s.id, s.name, s.coverage,\n" +
    "s.app_under_test,\n" +
    "t.created_at as most_recent,\n" +
    "t.pass_fail AS last_test\n" +
    "FROM scenario s LEFT JOIN test t on s.id = t.scenario_id\n" +
    "AND DATE(t.created_at) BETWEEN DATE('" + startsAt + "') AND DATE('" + endsAt + "')\n" +
    "WHERE LOWER(s.app_under_test) = LOWER('" + app + "')\n" +
    "AND s.client_priority = 1\n" +
    "GROUP BY s.id, s.name, s.coverage, app_under_test, most_recent, last_test\n" +
    "ORDER BY t.created_at ASC";
  const result = await db.sequelize.query(query, { type: QueryTypes.SELECT });
  return db.snakeCaseToCamelCase(result);
}

export const getEnhancementCount = async (app: string) => {
  const query = "SELECT COUNT(s.id) as count\n" +
    "FROM scenario s\n" +
    "LEFT JOIN test t ON s.id = t.scenario_id\n" +
    "AND t.created_at = (SELECT max(created_at) FROM test\n" +
    "WHERE scenario_id = s.id)\n" +
    "WHERE LOWER(s.app_under_test) = LOWER('" + app + "')\n" +
    "AND s.coverage = 'New Enhancements'\n" +
    "AND s.client_priority = 0\n" +
    "OR s.client_priority = NULL";
  const [{ count }] = await db.sequelize.query(query, { type: QueryTypes.SELECT });
  return count;
}

export const getRegressionCount = async (app: string) => {
  const query = "SELECT COUNT(s.id) as count\n" +
    "FROM scenario s\n" +
    "LEFT JOIN test t ON s.id = t.scenario_id\n" +
    "AND t.created_at = (SELECT max(created_at) FROM test\n" +
    "WHERE scenario_id = s.id)\n" +
    "WHERE LOWER(s.app_under_test) = LOWER('" + app + "')\n" +
    "AND s.coverage = 'Regression - Current Round'\n" +
    "AND s.client_priority = 0\n" +
    "OR s.client_priority = NULL";
  const [{ count }] = await db.sequelize.query(query, { type: QueryTypes.SELECT });
  return count;
}

export const getPriorityCount = async (app: string) => {
  const query = "SELECT COUNT(s.id) as count\n" +
    "FROM scenario s\n" +
    "LEFT JOIN test t ON s.id = t.scenario_id\n" +
    "AND t.created_at = (SELECT max(created_at) FROM test\n" +
    "WHERE scenario_id = s.id)\n" +
    "WHERE LOWER(s.app_under_test) = LOWER('" + app + "')\n" +
    "AND s.client_priority = 1";
  const [{ count }] = await db.sequelize.query(query, { type: QueryTypes.SELECT });
  return count;
}

export const getFlaggedCount = async (app: string) => {
  const query = "SELECT COUNT(s.id) as count\n" +
    "FROM scenario s\n" +
    "LEFT JOIN test t ON s.id = t.scenario_id\n" +
    "AND t.created_at = (SELECT max(created_at) FROM test\n" +
    "WHERE scenario_id = s.id)\n" +
    "WHERE LOWER(s.app_under_test) = LOWER('" + app + "')\n" +
    "AND s.review_flag = '1'";
  const [{ count }] = await db.sequelize.query(query, { type: QueryTypes.SELECT });
  return count;
}

export const getFlaggedScenarios = async (app: string, startsAt: string, endsAt: string) => {
  const query = "SELECT s.*\n" +
    "FROM scenario s\n" +
    "LEFT JOIN test t ON s.id = t.scenario_id\n" +
    "AND DATE(t.created_at) BETWEEN DATE('" + startsAt + "') AND DATE('" + endsAt + "')\n" +
    "WHERE t.created_at IS NOT NULL AND LOWER(s.app_under_test) = LOWER('" + app + "')\n" +
    "AND s.review_flag = '1'";
  const result = await db.sequelize.query(query, { type: QueryTypes.SELECT });
  return db.snakeCaseToCamelCase(result);
}

export const getPriorityScenarios = async (app: string, startsAt: string, endsAt: string) => {
  const query = "SELECT s.id, s.name, s.coverage,\n" +
    "s.app_under_test,\n" +
    "t.created_at as most_recent,\n" +
    "t.pass_fail AS last_test\n" +
    "FROM scenario s LEFT JOIN test t on s.id = t.scenario_id\n" +
    "AND DATE(t.created_at) BETWEEN DATE('" + startsAt + "') AND DATE('" + endsAt + "')\n" +
    "WHERE LOWER(s.app_under_test) = LOWER('" + app + "')\n" +
    "AND s.client_priority = 1\n" +
    "GROUP BY s.id, s.name, s.coverage, s.app_under_test, most_recent, last_test\n" +
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

export const addScenario = async (params) => {
  const model = await Scenario.create(params);
  await model.save();
  return model.id;
}

export const updateScenario = async (id, params) => {
  try {
    await Scenario.update({ ...params }, { where: { id }});
    return id;
  } catch (e) {
    return e;
  }
}

export const deleteScenario = async (id: string) => {
  try {
    await Scenario.destroy({ where: { id }});
    return `Scenario ${id} has been successfully deleted`;
  } catch (e) {
    return e;
  }
}

export const getPdfBlob = async (app: string, scenarioIds: number[]) => {
  const query = 'SELECT s.id, s.name, s.created_by, s.created_at,\n' +
    's.updated_at, s.updated_by, s.coverage, s.review_flag,\n' +
    's.script, s.preconditions, s.expected_result\n' +
    'FROM scenario s\n' +
    'WHERE LOWER(s.app_under_test) = LOWER(\'' + app + '\')\n' +
    'AND s.id in (' + scenarioIds.join(', ') + ')';
  const result = await db.sequelize.query(query, { type: QueryTypes.SELECT });
  const scenarios = db.snakeCaseToCamelCase(result);
  const date = new Date();
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const today = `${yyyy}-${mm}-${dd}`;
  const scenarioPath = 'https://betabase.herokuapp.com/scenario/';
  const ver = require('../../../../package.json').version;
  let contents = '';
  let cases = '';
  scenarios.forEach((scenario: ScenarioItem, index: number) => {
    contents = contents.concat(`
      <tr>
        <td>${index + 1}</td>
        <td>
          <a href="${scenarioPath}${app.replace(' ', '%20')}/${scenario.id}/show" target="_blank">${scenario.id}</a>
          <img width="6" height="6" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJCAYAAADgkQYQAAAACXBIWXMAAAsTAAALEwEAmpwYAAAGuWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDMgNzkuMTY0NTI3LCAyMDIwLzEwLzE1LTE3OjQ4OjMyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChNYWNpbnRvc2gpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyMS0wNi0xN1QxMjozOToxMiswMzowMCIgeG1wOk1vZGlmeURhdGU9IjIwMjEtMDctMDVUMjI6NTQ6NTcrMDM6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjEtMDctMDVUMjI6NTQ6NTcrMDM6MDAiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6YjFkYjYzMzgtMjI3Ny00ZjczLTlmMTctZWQyYmJjZjNlNzE5IiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjQ4RUJDOTcwRTBDOTExRTc5MERBQTJCNDQxQTQzODExIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6NDhFQkM5NzBFMEM5MTFFNzkwREFBMkI0NDFBNDM4MTEiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo4Q0Y5QjdDMEUwQzgxMUU3OTBEQUEyQjQ0MUE0MzgxMSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo0OEVCQzk2RUUwQzkxMUU3OTBEQUEyQjQ0MUE0MzgxMSIvPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo1OWIwNmVmOS0xYjJjLTRiM2UtOGI4MC0xZjU4ODA2OGU1ZTkiIHN0RXZ0OndoZW49IjIwMjEtMDYtMTdUMTI6NDE6MTYrMDM6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChNYWNpbnRvc2gpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpiMWRiNjMzOC0yMjc3LTRmNzMtOWYxNy1lZDJiYmNmM2U3MTkiIHN0RXZ0OndoZW49IjIwMjEtMDctMDVUMjI6NTQ6NTcrMDM6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi4xIChNYWNpbnRvc2gpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PkTiYVcAAABVSURBVBiVY/z//z8DOjDtvIoiyIShAgIYoZiBgYGBgQVdFxbF/1mQOMiAoHX/0TQxwhWdLtfGpgCrSRgKTpdrY/cd1FQ4gDn8v2nnVbggMpuBgYEBAEsfFKnlZiKrAAAAAElFTkSuQmCC" alt="img">
        </td>
        <td>
          <a href="#${scenario.id}">${scenario.name}</a>
        </td>
      </tr>
    `);
    cases = cases.concat(`
      <h3 id="${scenario.id}"><small>⚓</small> Case ${scenario.id}</h3>
      <table>
        <tbody>
          <tr>
            <td style="width: 120px; font-weight: bold;">Case Name</td>
            <td>${scenario.name}</td>
          </tr>
          <tr>
            <td style="width: 120px; font-weight: bold;">Preconditions</td>
            <td>${scenario.preconditions}</td>
          </tr>
          <tr>
            <td style="width: 120px; font-weight: bold;">Script</td>
            <td>${scenario.script}</td>
          </tr>
          <tr>
            <td style="width: 120px; font-weight: bold;">Expected Result</td>
            <td>${scenario.expectedResult}</td>
          </tr>
        </tbody>
      </table>
      <br>
    `);
  });

  const htmlOutput = `<html lang="en">
  <head>
    <title>All Cases ${today} ${app}</title>
    <style>
      h3, p {
        font-family: Helvetica, Roboto, Arial, sans-serif;
      }

      h3 small {
        color: grey;
      }

      body > p {
        color: grey;
        font-size: 14px;
      }

      table {
        width: 100%;
        font: 400 12px/1 Helvetica, Roboto, Arial, sans-serif;
        border-collapse: collapse;
      }

      td, th {
        border: 1px solid #dedede;
        padding: 0.25rem;
        text-align: left;
      }

      table a {
        color: #54adff;
        text-decoration: none;
      }

      table img:not(a + img) {
        width: 100%;
        max-width: calc(100% - 120px);
      }
    </style>
  </head>
  <body>
    <p>
      Generated by
      <img width="20" height="20" style="margin-bottom: -4px;" src="data:image/png;base64,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" alt="img">
      <span>βetabase</span>
      v.${ver} | ${today}
    </p>
    <h3>Contents</h3>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>ID</th>
          <th>Case Name</th>
        </tr>
      </thead>
      <tbody>${contents}</tbody>
    </table>
    <br>

    ${cases}
  </body>
</html>`;

  try {
    const blob = await generatePdf(htmlOutput);
    return (new Buffer(<Buffer>blob)).toString('base64');
  } catch (error) {
    return error;
  }
}

const generatePdf = (html: string) => {
  const options = {
    format: 'A4',
    orientation: 'portrait',
    margin: {
      top: 20,
      left: 20,
      right: 20,
      bottom: 40
    },
    paginationOffset: 1
  };
  return new Promise((resolve, reject) => {
    htmlToPdf.create(html, options).toBuffer((error, buffer) => {
      if (error) {
        reject(error);
      }
      resolve(buffer);
    });
  });
}

db.Scenario = Scenario;
