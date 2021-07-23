const express = require('express');
const Sequelize = require('sequelize');

const { dbHost, dbName, dbUser, dbPassword } = require('./config');

const app = express();
const port = 3000;
const sequelize = new Sequelize(dbName, dbUser, dbPassword, { host: dbHost, dialect: 'mysql' });

const establishDbConnection = async () => {
  try {
    await sequelize.authenticate();
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
