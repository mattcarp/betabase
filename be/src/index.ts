import express from 'express';
import cors from 'cors';

import db from './models';
import {
  getEnhancementCount,
  getEnhancementScenarios,
  getFlaggedCount,
  getFlaggedScenarios,
  getPriorities,
  getPriorityCount,
  getPriorityScenarios,
  getRegressionCount,
  getRegressionScenarios,
  getScenario,
  getScenarioCount,
  getScenarioList,
} from './models/scenario';
import { getFailCount, getJiras, getRoundNotes, getTestCount } from './models/round';
import { getDeployment } from './models/deployment';
import { getScenarioTests, getTestCountRange } from './models/test';

const app = express();
app.use(express.json());
app.use(cors());
const port = process.env.PORT || 3000;

const establishDbConnection = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

app.listen(port, async () => {
  console.log(`Running on port ${port}`);
  await establishDbConnection();
});

app.get('/', (request, response) => {
  response.send('Hello world!');
});

app.get('/api/app-list-data', async (request, response) => {
  const aomaScenarios = await getScenarioCount('AOMA');
  const promoScenarios = await getScenarioCount('Promo');
  const aomaRound = await getRoundNotes('AOMA');
  const promoRound = await getRoundNotes('Promo');
  const dxRound = await getRoundNotes('DX');
  const grasLiteRound = await getRoundNotes('GRAS Lite');
  const aomaTestCount = await getTestCount('AOMA');
  const promoTestCount = await getTestCount('Promo');
  const aomaFails = await getFailCount('AOMA');
  const promoFails = await getFailCount('Promo');
  response.json({
    aomaScenarios,
    promoScenarios,
    aomaRound,
    promoRound,
    dxRound,
    grasLiteRound,
    aomaTestCount,
    promoTestCount,
    aomaFails,
    promoFails,
  });
});

app.get('/api/:app/report-data', async (request, response) => {
  const app = request.params.app;
  const roundNotes = await getRoundNotes(app);
  const deployment = await getDeployment(app);
  const enhancementScenarios = await getEnhancementScenarios(app);
  const regressionScenarios = await getRegressionScenarios(app);
  const priorities = await getPriorities(app);
  const testsToday = await getTestCountRange(app, 'today');
  const testsYesterday = await getTestCountRange(app, 'yesterday');
  const testsThisWeek = await getTestCountRange(app, 'last7days');
  const jiras = await getJiras(app);
  const testCount = await getTestCount(app);
  const enhancementCount = await getEnhancementCount(app);
  const regressionCount = await getRegressionCount(app);
  const flaggedCount = await getFlaggedCount(app);
  const priorityCount = await getPriorityCount(app);
  const flaggedScenarios = await getFlaggedScenarios(app);
  const priorityScenarios = await getPriorityScenarios(app);
  response.json({
    roundNotes,
    deployment,
    enhancementScenarios,
    regressionScenarios,
    priorities,
    testsToday,
    testsYesterday,
    testsThisWeek,
    jiras,
    testCount,
    enhancementCount,
    regressionCount,
    flaggedCount,
    priorityCount,
    flaggedScenarios,
    priorityScenarios,
  });
});

app.get('/api/scenario/:id', async (request, response) => {
  const id = request.params.id;
  const scenario = await getScenario(id);
  const tests = await getScenarioTests(id);
  response.json({ scenario, tests });
});
app.get('/api/scenario-list/:app', async (request, response) => {
  const scenarios = await getScenarioList(request.params.app);
  response.json(scenarios);
});
