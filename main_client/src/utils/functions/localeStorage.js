export const getLocalStorageItem = (key) => localStorage.getItem(key);

/** esta funcion permite saber si hay o no un item en el localStorage, o si tiene o no un valor
 * @returns {boolean}
 */
export const existItem = (key) => localStorage.getItem(key);

export const removeLocaleStorageItem = (key) => localStorage.removeItem(key);

export const setLocaleStorageItems = ({ key, value }) =>
  localStorage.setItem(key, value);
