import * as express from 'express';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import * as path from 'path';
import * as session from 'express-session';
import * as Keycloak from 'keycloak-connect';

import db from './models';
import config from './config';
import {
  addScenario,
  deleteScenario,
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
  updateScenario,
} from './models/scenario';
import {
  addRound,
  deleteRound,
  getFailCount,
  getJiras,
  getRoundById,
  getRoundList,
  getRoundNotes,
  getTestCount,
  updateRound,
} from './models/round';
import { getDeployment } from './models/deployment';
import { addTest, getScenarioTests, getTest, getTestCountRange, getTestList } from './models/test';
import { addUser, sendResetPasswordToken, getUserByUsername, updateUser, getUserByToken } from './models/user';
import { addVariation, getScenarioVariations, updateVariation } from './models/variation';

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.raw({ limit: '50mb' }));
app.use(express.json());

const memoryStore = new session.MemoryStore();
app.use(session({
  secret: config.secret,
  resave: false,
  saveUninitialized: true,
  store: memoryStore,
}));

const keycloak = new Keycloak({
  store: memoryStore,
}, {
  'realm': 'thebetabase',
  'auth-server-url': 'https://betabase-keycloack.herokuapp.com/auth/',
  'ssl-required': 'external',
  'resource': 'thebetabase-client',
  'confidential-port': 0
});

app.use(keycloak.middleware());

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

app.get('/api/app-list-data', keycloak.protect(), async (request, response) => {
  const aomaScenarios = await getScenarioCount('AOMA');
  const promoScenarios = await getScenarioCount('Promo');
  const partnerPreviewerScenarios = await getScenarioCount('Partner Previewer');
  const aomaRound = await getRoundNotes('AOMA');
  const promoRound = await getRoundNotes('Promo');
  const dxRound = await getRoundNotes('DX');
  const grasLiteRound = await getRoundNotes('GRAS Lite');
  const partnerPreviewerRound = await getRoundNotes('Partner Previewer');
  const aomaTestCount = await getTestCount('AOMA');
  const promoTestCount = await getTestCount('Promo');
  const partnerPreviewerTestCount = await getTestCount('Partner Previewer');
  const aomaFails = await getFailCount('AOMA');
  const promoFails = await getFailCount('Promo');
  const partnerPreviewerFails = await getFailCount('Partner Previewer');
  response.json({
    aomaScenarios,
    promoScenarios,
    partnerPreviewerScenarios,
    aomaRound,
    promoRound,
    dxRound,
    grasLiteRound,
    partnerPreviewerRound,
    aomaTestCount,
    promoTestCount,
    partnerPreviewerTestCount,
    aomaFails,
    promoFails,
    partnerPreviewerFails,
  });
});

app.get('/api/:app/report-data', [keycloak.protect()], async (request, response) => {
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

app.post('/api/user', [keycloak.protect(), keycloak.protect(`${config.resource}:admin`)], async (request: any, response, next) => {
  const params = { ...request.body, password: bcrypt.hashSync(request.body.password, 8) };
  const model = await addUser(params);
  response.json(model);
});

app.put('/api/user/:id', [keycloak.protect(), keycloak.protect(`${config.resource}:admin`)], async (request: any, response, next) => {
  const params = request.body;
  if ('password' in params) {
    delete params.password;
  }
  const model = await updateUser(request.params.id, params);
  response.json(model);
});

app.post('/api/auth/sign-in', async (request: any, response, next) => {
  const user = await getUserByUsername(request.body.username);
  if (!user) {
    return response.status(404).send({ message: 'User Not found.' });
  }
  const passwordIsValid = bcrypt.compareSync(request.body.password, user.password);
  if (!passwordIsValid) {
    return response.status(401).send({
      accessToken: null,
      message: 'Invalid Password!',
    });
  }
  const accessToken = jwt.sign({ id: user.id }, config.secret, { expiresIn: 86400 });
  await updateUser(user.id, { lastLogin: new Date() });
  response.status(200).send({
    accessToken,
    id: user.id,
    username: user.username,
    email: user.email,
    roles: user.roles,
    jiraUsername: user.jiraUsername,
  });
});

app.post('/api/auth/reset-password', async (request: any, response, next) => {
  const user = await getUserByUsername(request.body.email);
  if (!user) {
    return response.status(404).json('User Not found.');
  }
  await sendResetPasswordToken(user.id, user.username, user.emailCanonical);
  response.status(200).json('Email has been sent.');
});

app.post('/api/auth/check-token', async (request: any, response, next) => {
  const token = request.body.token;
  const user = await getUserByUsername(request.body.email);
  if (!user) {
    return response.status(404).json('User Not found.');
  }
  const valid = token === user.confirmationToken;
  response.json({
    valid,
    message: valid ? 'Token matches.' : 'Token doesn\'t match.',
  });
});

app.post('/api/auth/set-password-with-token', async (request: any, response, next) => {
  const token = request.body.token;
  const user = await getUserByToken(token);
  if (!user) {
    return response.status(404).json('Token not found.');
  }
  await updateUser(user.id, {
    password: bcrypt.hashSync(request.body.password, 8),
    confirmationToken: '',
  });
  return response.status(200).json('Password has been set.');
});

app.get('/api/scenario/:id', [keycloak.protect()], async (request, response) => {
  const id = request.params.id;
  const scenario = await getScenario(id);
  const tests = await getScenarioTests(id);
  const variations = await getScenarioVariations(request.params.id);
  response.json({ scenario, tests, variations });
});

app.get('/api/scenarios/:app', [keycloak.protect()], async (request, response) => {
  const scenarios = await getScenarioList(request.params.app);
  response.json(scenarios);
});

app.post('/api/scenario', [keycloak.protect()], async (request, response) => {
  const params = request.body;
  const model = await addScenario(params);
  response.json(model);
});

app.put('/api/scenario/:id', [keycloak.protect()], async (request, response) => {
  const id = request.params.id;
  const params = request.body;
  const result = await updateScenario(id, params);
  response.send(result);
});

app.delete('/api/scenario/:id', [keycloak.protect(), keycloak.protect(`${config.resource}:admin`)], async (request, response) => {
  const id = request.params.id;
  const result = await deleteScenario(id);
  response.json(result);
});

app.post('/api/test', [keycloak.protect()], async (request, response) => {
  const params = request.body;
  const model = await addTest(params);
  response.json(model);
});

app.get('/api/tests/:app', [keycloak.protect()], async (request, response) => {
  const model = await getTestList(request.params.app);
  response.json(model);
});

app.get('/api/test/:id', [keycloak.protect()], async (request, response) => {
  const model = await getTest(request.params.id);
  response.json(model);
});

app.post('/api/scenario/order', [keycloak.protect()], async (request, response) => {
  const { items, type } = request.body;
  let prop;
  switch (type) {
    case 'enhancementScenarios':
      prop = 'enhancementSortOrder';
      break;
    case 'priorityScenarios':
      prop = 'prioritySortOrder';
      break;
    case 'regressionScenarios':
      prop = 'currentRegressionSortOrder';
      break;
    default:
      break;
  }
  items.forEach((item, index) => {
    const params = {
      ...item,
      [prop]: index,
    };
    updateScenario(params.id, params);
  });
  response.send(items);
});

app.post('/api/variation', [keycloak.protect()], async (request, response) => {
  const params = request.body;
  const model = await addVariation(params);
  response.json(model);
});

app.put('/api/variation/:id', [keycloak.protect()], async (request, response) => {
  const id = request.params.id;
  const params = request.body;
  const model = await updateVariation(id, params);
  response.json(model);
});

app.get('/api/rounds/:app', [keycloak.protect(), keycloak.protect(`${config.resource}:admin`)], async (request, response) => {
  const rounds = await getRoundList(request.params.app);
  response.json(rounds);
});

app.get('/api/round/:id', [keycloak.protect(), keycloak.protect(`${config.resource}:admin`)], async (request, response) => {
  const round = await getRoundById(request.params.id);
  response.json(round);
});

app.delete('/api/round/:id', [keycloak.protect(), keycloak.protect(`${config.resource}:admin`)], async (request, response) => {
  const status = await deleteRound(request.params.id);
  response.json(status);
});

app.post('/api/round', [keycloak.protect(), keycloak.protect(`${config.resource}:admin`)], async (request, response) => {
  const model = await addRound(request.body);
  response.json(model);
});

app.put('/api/round/:id', [keycloak.protect(), keycloak.protect(`${config.resource}:admin`)], async (request, response) => {
  const id = request.params.id;
  const params = request.body;
  const model = await updateRound(id, params);
  response.json(model);
});

// static files
app.get('*.*', express.static(path.join(__dirname, '../fe/')));
// main route (angular app)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../fe/index.html'));
});
// catch 404 and forward to error handler
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, '../fe/index.html'));
});
