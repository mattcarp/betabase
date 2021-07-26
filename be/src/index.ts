import express from 'express';

import db from './models';
import { getScenarioCount } from './models/scenario';

const app = express();
app.use(express.json());
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

app.get('/api/apps', async (request, response) => {
  const aomaScenarios = await getScenarioCount('AOMA');
  const promoScenarios = await getScenarioCount('Promo');
  response.json({ aomaScenarios, promoScenarios });
});
