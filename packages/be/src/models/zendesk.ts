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

export const getZendeskTickets = async () => {
  const url = apiUrl + '/api/v2/tickets';
  const response = await fetchZendeskData(url, 'tickets', false);
  return response;
}

export const getZendeskTicket = async (id: string) => {
  const url = apiUrl + '/api/v2/tickets/' + id;
  const response = await fetchZendeskData(url, 'ticket', true);
  return response;
}

export const getZendeskTicketComments = async (id: string) => {
  const url = apiUrl + '/api/v2/tickets/' + id + '/comments';
  const response = await fetchZendeskData(url, 'comments', false);
  return response;
}

const fetchZendeskData = async (url: string, propName: string, singleItem: boolean) => {
  try {
    const response = await axios.get(url, headers);
    const data = singleItem
      ? [response?.data?.[propName] || {}]
      : response?.data?.[propName] || [];
    const items = db.snakeCaseToCamelCase(data);
    const result = singleItem ? items?.[0] : items;
    return { [propName]: result, error: null };
  } catch (e) {
    return { error: e.response.data.error, [propName]: null };
  }
}
