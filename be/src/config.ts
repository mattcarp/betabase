const dotenv = require('dotenv');

dotenv.config();

if (!process.env.DB_HOST) {
  throw Error('DB_HOST is not defined');
}

if (!process.env.DB_NAME) {
  throw Error('DB_NAME is not defined');
}

if (!process.env.DB_USER) {
  throw Error('DB_USER is not defined');
}

if (!process.env.DB_PASSWORD) {
  throw Error('DB_PASSWORD is not defined');
}

const config = {
  dbHost: process.env.DB_HOST,
  dbName: process.env.DB_NAME,
  dbUser: process.env.DB_USER,
  dbPassword: process.env.DB_PASSWORD,
};

export default config;
