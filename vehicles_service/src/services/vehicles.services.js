const {
  getPagination,
  getPagingData,
} = require("../../../common/utils/pagination");
const { v4: uuidv4 } = require("uuid");
const vehicles = require("#M/vehicles.model");

exports.get = async (query) => {
  try {
    const { page = 1, size = 10 } = query;
    const { limit, offset } = getPagination(page, size);
    let allRecords = await vehicles.findAndCountAll({
      limit,
      offset,
      order: [["created_at", "DESC"]],
    });
    allRecords = getPagingData(allRecords, offset, limit);
    return allRecords;
  } catch (error) {
    throw error;
  }
};
exports.createOrUpdate = async (data) => {
  try {
    if (!data.id) {
      data.id = uuidv4();
      const vehicle = await vehicles.create(data);
      return vehicle;
    }

    // Actualizar solo los campos proporcionados
    const [affectedRows] = await vehicles.update(data, {
      where: { id: data.id },
      returning: true,
    });

    if (affectedRows === 0) {
      throw new Error("No se encontró el vehículo para actualizar.");
    }

    const updatedVehicle = await vehicles.findByPk(data.id); // Obtener el registro actualizado
    return updatedVehicle;
  } catch (error) {
    throw error;
  }
};
