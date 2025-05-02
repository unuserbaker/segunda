import CryptoJs from 'crypto-js';
import { jwtDecode } from 'jwt-decode';
import { LOCALSTORAGE_KEYS, ROUTE_IDS } from '../vars';
import Config from '@/core/config';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const muiColors = {
  inherit: 'inherit',
  primary: 'primary',
  secondary: 'secondary',
  success: 'success',
  error: 'error',
  info: 'info',
  warning: 'warning',
};

export const setColorsMui = (color) => muiColors[color] || undefined;

export const encryptValue = (value) => {
  return CryptoJs.DES.encrypt(value, Config.secretKeCrypto).toString();
};

export const decryptValue = async (enncriptedValue) => {
  try {
    const bytes = CryptoJs.DES.decrypt(enncriptedValue, Config.secretKeCrypto);
    return bytes.toString(CryptoJs.enc.Utf8);
  } catch (error) {
    throw new Error('error:: decryptValue');
  }
};

export const getInfoTokenUserLogged = async () => {
  const tknLoc = localStorage.getItem(LOCALSTORAGE_KEYS.token);
  if (!tknLoc) return false;
  const decriptTknLoc = await decryptValue(tknLoc);
  return jwtDecode(decriptTknLoc);
};

export const throwErrorPage = (error) => {
  throw new Response(error['message'], { status: error['status'] || 509 });
};

export const convertirObjeto = (objeto, prefijo = '', resultado = {}) => {
  for (let clave in objeto) {
    if (typeof objeto[clave] === 'object') {
      convertirObjeto(objeto[clave], prefijo + clave + '.', resultado);
    } else {
      resultado[prefijo + clave] = objeto[clave];
    }
  }
  return resultado;
};

export const getNumeroDiaActual = () => {
  const fecha = new Date().toLocaleString('es-CO');
  const fechaArr = fecha.split('/');
  const dia = fechaArr[0];
  const diaFormateado = dia < 10 ? `0${dia}` : dia;
  return diaFormateado;
};

export const obtenerDiasAnteriores = (diasAnterires = 3) => {
  const fecha = getFechaColombia();
  return Array.from({ length: diasAnterires }, (_, i) => {
    const nuevaFecha = new Date(fecha);
    nuevaFecha.setDate(fecha.getDate() - i);
    return {
      day: nuevaFecha.getDate(),
      fecha: nuevaFecha.toISOString().split('T')[0],
      pos: 'L',
    };
  });
};

export const obtenerDiasPosteriores = (diasPosteriores = 2) => {
  const fecha = getFechaColombia();
  return Array.from({ length: diasPosteriores }, (_, i) => {
    const nuevaFecha = new Date(fecha);
    nuevaFecha.setDate(fecha.getDate() + i + 1);
    return {
      day: nuevaFecha.getDate(),
      fecha: nuevaFecha.toISOString().split('T')[0],
      pos: 'R',
    };
  });
};

export const obtenerDiasAnterioresYPosteriores = (
  cantPrevDays,
  cantPostDays
) => {
  const diasAnteriores = obtenerDiasAnteriores(cantPrevDays).reverse();
  const diasPosteriores = obtenerDiasPosteriores(cantPostDays);
  return [...diasAnteriores, ...diasPosteriores];
};
export const getCurrentDate = (date) => {
  const now = date ? new Date(date) : new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - timezoneOffset);
};

export const getFechaColombia = (date = null) => {
  const fecha = date ? new Date(date) : new Date();
  return new Date(
    fecha.toLocaleString('en-US', { timeZone: 'America/Bogota' })
  );
};

export const formatFechaToStringCol = (fecha) => {
  const date = fecha ? new Date(fecha) : new Date();

  const formatterDate = new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return formatterDate.format(date);
};

export const throwErrors = (error) => {
  throw {
    message: error['response']['data']['errors']['message'],
    status: error['response']['status'],
  };
};

export const convertirFechaAHoraColombiana = (
  fechaInput,
  formato = 'yyyy-MM-dd HH:mm:ss'
) => {
  try {
    if (typeof fechaInput === 'string') {
      if (!fechaInput.includes('T')) fechaInput += 'T00:00:00-05:00';
    } else if (fechaInput instanceof Date) {
      fechaInput = fechaInput.toISOString().replace('Z', '-05:00');
    } else {
      throw new Error(
        'La entrada debe ser una cadena ISO o una instancia de Date.'
      );
    }
    let fecha = new Date(fechaInput);
    return format(fecha, formato, { locale: es });
  } catch (error) {
    throw new Error('convert fecha error:: ');
  }
};

export const formatDateTables = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDiaStrName = (fecha, complete) =>
  convertirFechaAHoraColombiana(fecha, complete ? 'EEEE' : 'EEEEEE');

export const findPrimaryKeyValue = (objeto) => {
  let value = undefined;
  for (const clave in objeto) {
    if (
      clave.startsWith('id') &&
      clave[2] &&
      clave[2] === clave[2].toUpperCase() &&
      clave[2] !== clave[2].toLowerCase()
    ) {
      value = objeto[clave];
      break;
    }
  }
  return value;
};

export const getRouteId = (pathName) => {
  const page = pathName.split('/')[1];
  return ROUTE_IDS[page.toUpperCase()];
};

export const sonObjetosIguales = (objOne, objTwo) => {
  const str1 = JSON.stringify(objOne);
  const str2 = JSON.stringify(objTwo);
  return str1 === str2;
};

export const eliminarDuplicadosPorClaves = (arrayDeObjetos, clavesArr) => {
  if (arrayDeObjetos?.length <= 1) return arrayDeObjetos;

  const clavesVistas = new Set();
  const resultado = arrayDeObjetos.filter((objeto) => {
    const claveString = clavesArr.map((clave) => objeto[clave]).join('|');

    if (clavesVistas.has(claveString)) {
      return false;
    }

    clavesVistas.add(claveString);
    return true;
  });

  return resultado;
};
