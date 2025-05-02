const API_VEHICLES = {
  VEHICLES: { GET_VEHICLES: 'vehicles/api/v1/vehicles/', POST_VEHICLES_CREATE: 'vehicles/api/v1/vehicles/', PUT_VEHICLES_UPDATE: (idVehicle) => `vehicles/api/v1/vehicles/${idVehicle}` },
  TYPES: { GET_TYPES: 'vehicles/api/v1/vehicleTypes/' },
  TRANSMISSIONS: { GET_TRANSMISSIONS: '/vehicles/api/v1/vehicleTransmissions/' },
  CATEGORIES: { GET_CATEGORIES: '/vehicles/api/v1/vehicleCategories/' },
  BRANDS: { GET_BRANDS: '/vehicles/api/v1/vehicleBrands/' },
  ENGINE_TYPES: { GET_ENGINE_TYPES: '/vehicles/api/v1/engineTypes/' },
};

export default API_VEHICLES;
