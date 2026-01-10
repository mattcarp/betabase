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

const fetchZendeskData = async (url: string, propName: string, singleItem: boolean) => {
  try {
    const response = await axios.get(url, headers);
    const data = singleItem
      ? [response?.data?.[propName] || {}]
      : response?.data?.[propName] || [];
    const items = db.snakeCaseToCamelCase(data);
    const result = { [propName]: singleItem ? items?.[0] : items, error: null };
    if (response?.data?.hasOwnProperty('count')) {
      result.count = response?.data?.count;
    }
    return result;
  } catch (e) {
    return { error: e.response.data.error, [propName]: null };
  }
}

const getZendeskQueryParams = (params: { [key: string]: string }) => {
  const queryParams = [];
  for (const [key, value] of Object.entries(params)) {
    if (String(value)?.length) {
      switch (key) {
        case 'page':
          queryParams.push(`page=${value}`);
          break;
        case 'limit':
          queryParams.push(`per_page=${value}`);
          break;
        case 'sortField':
          queryParams.push(`sort_by=${value}`);
          break;
        case 'sortDirection':
          queryParams.push(`sort_order=${value.toLowerCase()}`);
          break;
      }
    }
  }
  return `?${queryParams.join('&')}`;
}

export const getZendeskTickets = async (queryParams: { [key: string]: string }) => {
  const url = apiUrl + '/api/v2/tickets' + getZendeskQueryParams(queryParams);
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

export const getZendeskUsers = async (ids: string) => {
  const url = apiUrl + '/api/v2/users/show_many' + '?ids=' + ids;
  const response = await fetchZendeskData(url, 'users', false);
  return response;
}
