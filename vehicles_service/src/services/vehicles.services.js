const { getPagination, getPagingData } = require("../../../common/utils/pagination");

const vehicles = require("#M/vehicles.model");

exports.get = async (query) => {
  try {
    const { page = 1, size = 10 } = query;
    const { limit, offset } = getPagination(page, size);
    let allRecords = await vehicles.findAndCountAll({
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });
    allRecords = getPagingData(allRecords, offset, limit);
    return allRecords;
  } catch (error) {
    throw new Error(error.message);
  }
}

exports.create = async (data) => {
  try {
    const createVehicle = await vehicles.create(data);
    return createVehicle;
  } catch (error) {
    throw new Error(error.message);
  }
}