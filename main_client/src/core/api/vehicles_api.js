const API_VEHICLES = {
  VEHICLES: { GET_VEHICLES: 'vehicles', POST_VEHICLES_CREATE: 'vehicles', PUT_VEHICLES_UPDATE: (idVehicle) => `vehicles/${idVehicle}` },
  TYPES: { GET_TYPES: 'types' },
  TRANSMISSIONS: { GET_TRANSMISSIONS: 'transmissions' },
  CATEGORIES: { GET_CATEGORIES: 'categories' },
  BRANDS: { GET_BRANDS: 'brands' },
  ENGINE_TYPES: { GET_ENGINE_TYPES: 'engine_types' },
  STATUS: { GET_SATUS: 'status' },
};

export default API_VEHICLES;
