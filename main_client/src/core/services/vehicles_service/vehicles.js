import API_VEHICLES from '@/core/api/vehicles_api.js';
import { request } from '@/core/axios';

export const getVehicles = async () => {
  try {
    const { data } = await request({
      url: API_VEHICLES.VEHICLES.GET_VEHICLES,
    });
    return data;
  } catch (error) {
    throw {
      message: error['response']['data']['errors']['message'],
      status: error['response']['status'],
    };
  }
};

export const createVehicle = async (dataSend) => {
  try {
    const { data } = await request(
      {
        url: API_VEHICLES.VEHICLES.POST_VEHICLES_CREATE,
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

export const updateVehicle = async (usuario, dataSend) => {
  try {
    const { data } = await request(
      {
        url: API_VEHICLES.VEHICLES.PUT_VEHICLES_UPDATE(usuario),
        data: { ...dataSend },
      },
      'put'
    );
    return data;
  } catch (error) {
    throw {
      message: error['response']['data']['errors']['message'],
      status: error['response']['status'],
    };
  }
};