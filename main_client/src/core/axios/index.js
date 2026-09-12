import axios from 'axios';
import Config from '../config';
import { LOCALSTORAGE_KEYS } from '@/utils/vars';

export const getheadersConf = () => {
  const token = localStorage.getItem(LOCALSTORAGE_KEYS['token']);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const axiosService = axios.create({
  baseURL: Config.baseUrl,
  headers: getheadersConf(),
});

axiosService.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem(LOCALSTORAGE_KEYS['token']);
      localStorage.removeItem(LOCALSTORAGE_KEYS['usuario']);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const axiosFilesService = axios.create({
  baseURL: Config.baseUrl,
  headers: getheadersConf(),
});

/**
 *
 * @param {url:string,data:object} request
 * @param {"get"|"post"|"put"|"patch"} method
 * @returns {Promise}
 */
export const request = async ({ url, data }, method = 'get') => {
  if (!['get', 'post', 'put', 'patch'].includes(method)) return;
  return await axiosService[method](
    url,
    method !== 'get' ? { ...data } : { ...data, headers: getheadersConf() },
    method !== 'get' && { headers: getheadersConf() }
  );
};

export const requestFiles = async ({ url, data }) => {
  return await axiosFilesService.post(url, data, {
    headers: {
      ...getheadersConf(),
      'Content-Type': 'multipart/form-data',
    },
  });
};
