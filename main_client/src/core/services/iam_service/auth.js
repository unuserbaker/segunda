import API_AUTH from '@/core/api/auth_api.js';
import { request } from '@/core/axios';

export const login = async (dataSend) => {
  try {
    const { data } = await request(
      {
        url: API_AUTH.AUTH.POST_LOGIN,
        data: { ...dataSend },
      },
      'post'
    );
    return data;
  } catch (error) {
    throw {
      message: error['response']['data']['errors']['message'],
      status: error['response']['status'],
    };
  }
};

export const register = async (dataSend) => {
  try {
    const { data } = await request(
      {
        url: API_AUTH.AUTH.POST_REGISTER,
        data: { ...dataSend },
      },
      'post'
    );
    return data;
  } catch (error) {
    throw {
      message: error['response']['data']['errors']['message'],
      status: error['response']['status'],
    };
  }
};
