import * as express from 'express';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import * as path from 'path';

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
import {
  addTest,
  deleteTest,
  getScenarioTests,
  getTest,
  getTestCountRange,
  getTestList,
  updateTest,
} from './models/test';
import {
  addUser,
  sendResetPasswordToken,
  getUserByUsername,
  updateUser,
  getUserByToken,
  getUser,
  getUsers,
  deleteUser,
} from './models/user';
import { addVariation, getScenarioVariations, updateVariation } from './models/variation';

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.raw({ limit: '50mb' }));
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

const isTokenValid = (req, res, next) => {
  const token = req.headers['x-access-token'];
  if (!token) {
    return res.status(401).send({ message: 'No token provided!' });
  }
  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'Unauthorized!' });
    }
    req.userId = decoded.id;
    next();
  });
};

const isAdmin = async (req, res, next) => {
  const user = await getUser(req.userId);
  const isAdmin = !!(user?.roles || '').split(',').find((role: string) => role === 'ROLE_ADMIN');
  if (!user || !isAdmin) {
    return res.status(403).send({ message: 'Not enough rights' });
  }
  next();
};

app.get('/api/get-scenario-count/:app', [isTokenValid], async (request, response) => {
  const quantity = await getScenarioCount(request.params.app);
  response.json(quantity);
});

app.get('/api/get-round-notes/:app', [isTokenValid], async (request, response) => {
  const roundNotes = await getRoundNotes(request.params.app);
  response.json(roundNotes);
});

app.get('/api/get-test-count/:app', [isTokenValid], async (request, response) => {
  request.setTimeout(60 * 1000 * 100);
  const testCount = await getTestCount(request.params.app);
  response.json(testCount);
});

app.get('/api/get-fail-count/:app', [isTokenValid], async (request, response) => {
  const failCount = await getFailCount(request.params.app);
  response.json(failCount);
});

app.get('/api/:app/report-data', [isTokenValid], async (request, response) => {
  request.setTimeout(60 * 1000 * 10);
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

app.post('/api/users', [isTokenValid, isAdmin], async (request: any, response, next) => {
  const params = { ...request.body, password: bcrypt.hashSync(request.body.password, 8) };
  const model = await addUser(params);
  response.json(model);
});

app.put('/api/users/:id', [isTokenValid, isAdmin], async (request: any, response, next) => {
  const params = request.body;
  if ('password' in params) {
    delete params.password;
  }
  await updateUser(request.params.id, params);
  response.json(params);
});

app.get('/api/users', [isTokenValid, isAdmin], async (request: any, response, next) => {
  const userItems = await getUsers();
  const model = userItems?.map(({ dataValues }) => ({
    ...dataValues,
    password: null,
    salt: null,
    confirmationToken: null,
  }));
  response.json(model);
});

app.get('/api/users/:id', [isTokenValid, isAdmin], async (request: any, response, next) => {
  const model = await getUser(request.params.id);
  delete model.password;
  delete model.salt;
  delete model.confirmationToken;
  response.json(model);
});

app.delete('/api/users/:id', [isTokenValid, isAdmin], async (request: any, response, next) => {
  const model = await deleteUser(request.params.id);
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
    enabled: user.enabled,
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

app.get('/api/scenario/:id', [isTokenValid], async (request, response) => {
  const id = request.params.id;
  const scenario = await getScenario(id);
  const tests = await getScenarioTests(id);
  const variations = await getScenarioVariations(request.params.id);
  response.json({ scenario, tests, variations });
});

app.get('/api/scenarios/:app', [isTokenValid], async (request, response) => {
  const scenarios = await getScenarioList(request.params.app);
  response.json(scenarios);
});

app.post('/api/scenario', [isTokenValid], async (request, response) => {
  const params = request.body;
  const model = await addScenario(params);
  response.json(model);
});

app.put('/api/scenario/:id', [isTokenValid], async (request, response) => {
  const id = request.params.id;
  const params = request.body;
  const result = await updateScenario(id, params);
  response.send(result);
});

app.delete('/api/scenario/:id', [isTokenValid, isAdmin], async (request, response) => {
  const id = request.params.id;
  const result = await deleteScenario(id);
  response.json(result);
});

app.post('/api/test', [isTokenValid], async (request, response) => {
  request.setTimeout(60 * 1000 * 10);
  const params = request.body;
  const model = await addTest(params);
  response.json(model);
});

app.get('/api/tests/:app', [isTokenValid], async (request, response) => {
  const model = await getTestList(request.params.app);
  response.json(model);
});

app.get('/api/test/:id', [isTokenValid], async (request, response) => {
  const model = await getTest(request.params.id);
  response.json(model);
});

app.put('/api/test/:id', [isTokenValid], async (request, response) => {
  request.setTimeout(60 * 1000 * 10);
  const id = request.params.id;
  const params = request.body;
  const model = await updateTest(id, params);
  response.json(model);
});

app.delete('/api/test/:id', [isTokenValid, isAdmin], async (request, response) => {
  const id = request.params.id;
  const result = await deleteTest(id);
  response.json(result);
});

app.post('/api/scenario/order', [isTokenValid], async (request, response) => {
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

app.post('/api/variation', [isTokenValid], async (request, response) => {
  const params = request.body;
  const model = await addVariation(params);
  response.json(model);
});

app.put('/api/variation/:id', [isTokenValid], async (request, response) => {
  const id = request.params.id;
  const params = request.body;
  const model = await updateVariation(id, params);
  response.json(model);
});

app.get('/api/rounds/:app', [isTokenValid, isAdmin], async (request, response) => {
  const rounds = await getRoundList(request.params.app);
  response.json(rounds);
});

app.get('/api/round/:id', [isTokenValid, isAdmin], async (request, response) => {
  const round = await getRoundById(request.params.id);
  response.json(round);
});

app.delete('/api/round/:id', [isTokenValid, isAdmin], async (request, response) => {
  const status = await deleteRound(request.params.id);
  response.json(status);
});

app.post('/api/round', [isTokenValid, isAdmin], async (request, response) => {
  const model = await addRound(request.body);
  response.json(model);
});

app.put('/api/round/:id', [isTokenValid, isAdmin], async (request, response) => {
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
