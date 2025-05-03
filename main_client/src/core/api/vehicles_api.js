const API_VEHICLES = {
  VEHICLES: { GET_VEHICLES: 'vehicles/vehicles', POST_VEHICLES_CREATE: 'vehicles/vehicles/', PUT_VEHICLES_UPDATE: (idVehicle) => `vehicles/vehicles/${idVehicle}` },
  TYPES: { GET_TYPES: 'vehicles/vehicle_types' },
  TRANSMISSIONS: { GET_TRANSMISSIONS: '/vehicles/vehicle_transmissions' },
  CATEGORIES: { GET_CATEGORIES: '/vehicles/vehicle_categories' },
  BRANDS: { GET_BRANDS: '/vehicles/vehicle_brands' },
  ENGINE_TYPES: { GET_ENGINE_TYPES: '/vehicles/engine_types' },
};

export default API_VEHICLES;
