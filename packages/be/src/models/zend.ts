import axios from 'axios';

import config from '../config';
import db from './index';

const apiUrl = `https://${config.zendeskDomain}.zendesk.com`;
const authToken = Buffer
  .from(config.zendeskEmail + '/token:' + config.zendeskApiToken)
  .toString('base64');
const headers = {
  headers: {
    Authorization: `Basic ${authToken}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
};

export const getZendTickets = async () => {
  const url = apiUrl + '/api/v2/tickets';
  const response = await axios.get(url, headers);
  return db.snakeCaseToCamelCase(response?.data?.tickets || []);
}
