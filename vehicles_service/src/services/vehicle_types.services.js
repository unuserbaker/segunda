const { getPagination, getPagingData } = require("../../../common/utils/pagination");

const vehicleTypes = require("#M/vehicle_types.model");

exports.get = async (query) => {
  try {
    const { page = 1, size = 10 } = query;
    const { limit, offset } = getPagination(page, size);
    let allRecords = await vehicleTypes.findAndCountAll({
      limit,
      offset,
      order: [["created_at", "DESC"]],
    });
    allRecords = getPagingData(allRecords, offset, limit);
    return allRecords;
  } catch (error) {
    throw new Error(error.message);
  }
}
