import axios from 'axios';
import Config from '../config';
import { LOCALSTORAGE_KEYS } from '@/utils/vars';
export const getheadersConf = () => {
  return {
    'Content-Type': 'application/json',
    Authorization: Config.authorization,
    tk: localStorage.getItem(LOCALSTORAGE_KEYS['token']),
  };
};

export const axiosService = axios.create({
  baseURL: Config.baseUrl,
  headers: getheadersConf(),
});

export const axiosFilesService = axios.create({
  baseURL: Config.baseUrl,
  headers: {
    Authorization: Config.authorization,
  },
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
      'Content-Type': 'multipart/form-data',
      tk: localStorage.getItem(LOCALSTORAGE_KEYS['token']),
    },
  });
};
