import { Sequelize } from 'sequelize';

import config from '../config';

const sequelize = new Sequelize(config.dbName, config.dbUser, config.dbPassword, {
  host: config.dbHost,
  dialect: 'mysql',
});

const getFormattedKey = (s) => {
  return s.replace(/([-_][a-z])/ig, (k) => {
    return k.toUpperCase().replace('_', '');
  });
};

const snakeCaseToCamelCase = (items) => {
  return items.map(item => {
    const newItem: any = {};
    Object.keys(item).forEach((key: string) => {
      newItem[getFormattedKey(key)] = item[key];
    });
    return newItem;
  });
};

const db: any = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.snakeCaseToCamelCase = snakeCaseToCamelCase;

export default db;
