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

if (!process.env.TWILIO_ACCOUNT_SID) {
  throw Error('TWILIO_ACCOUNT_SID is not defined');
}

if (!process.env.TWILIO_AUTH_TOKEN) {
  throw Error('TWILIO_AUTH_TOKEN is not defined');
}

if (!process.env.ZENDESK_DOMAIN) {
  throw Error('ZENDESK_DOMAIN is not defined');
}

if (!process.env.ZENDESK_EMAIL) {
  throw Error('ZENDESK_EMAIL is not defined');
}

if (!process.env.ZENDESK_API_TOKEN) {
  throw Error('ZENDESK_API_TOKEN is not defined');
}

const config = {
  dbHost: process.env.DB_HOST,
  dbName: process.env.DB_NAME,
  dbUser: process.env.DB_USER,
  dbPassword: process.env.DB_PASSWORD,
  secret: 'the-betabase-3-secret-key',
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
  zendeskDomain: process.env.ZENDESK_DOMAIN,
  zendeskEmail: process.env.ZENDESK_EMAIL,
  zendeskApiToken: process.env.ZENDESK_API_TOKEN,
};

export default config;
