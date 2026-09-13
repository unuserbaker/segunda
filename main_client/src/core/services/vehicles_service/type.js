import API_VEHICLES from '@/core/api/vehicles_api.js';
import { request } from '@/core/axios';

export const getTypes = async (params = {}) => {
  try {
    const { data } = await request({
      url: API_VEHICLES.TYPES.GET_TYPES,
      data: { params },
    });
    return data;
  } catch (error) {
    throw {
      message: error['response']['data']['errors']['message'],
      status: error['response']['status'],
    };
  }
};