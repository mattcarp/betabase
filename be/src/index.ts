import express from 'express';
import cors from 'cors';

import db from './models';
import { getScenarioCount } from './models/scenario';
import { getFailCount, getRoundNotes, getTestCount } from './models/round';

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
