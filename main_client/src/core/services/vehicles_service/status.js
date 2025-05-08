import API_VEHICLES from '@/core/api/vehicles_api.js';
import { request } from '@/core/axios';

export const getStatus = async () => {
  try {
    const { data } = await request({
      url: API_VEHICLES.STATUS.GET_SATUS,
    });
    return data;
  } catch (error) {
    throw {
      message: error['response']['data']['errors']['message'],
      status: error['response']['status'],
    };
  }
};