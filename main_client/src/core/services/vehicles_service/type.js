import API_VEHICLES from '@/core/api/vehicles_api.js';
import { request } from '@/core/axios';

export const getTypes = async () => {
  try {
    const { data } = await request({
      url: API_VEHICLES.TYPES.GET_TYPES,
    });
    return data;
  } catch (error) {
    throw {
      message: error['response']['data']['errors']['message'],
      status: error['response']['status'],
    };
  }
};