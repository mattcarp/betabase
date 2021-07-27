import { Sequelize } from 'sequelize';

import config from '../config';

const sequelize = new Sequelize(config.dbName, config.dbUser, config.dbPassword, {
  host: config.dbHost,
  dialect: 'mysql',
});

const db: any = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

export default db;
