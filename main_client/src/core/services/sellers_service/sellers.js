import API_SELLERS from '@/core/api/sellers_api.js';
import { request } from '@/core/axios';

export const getMySeller = async () => {
  try {
    const { data } = await request({
      url: API_SELLERS.SELLERS.GET_ME,
    });
    return data;
  } catch (error) {
    throw {
      message: error['response']?.['data']?.['errors']?.['message'],
      status: error['response']?.['status'],
    };
  }
};
