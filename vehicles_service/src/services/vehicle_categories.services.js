const { getPagination, getPagingData } = require("../../../common/utils/pagination");

const vehicleCategories = require("#M/vehicle_categories.model");

exports.get = async (query) => {
  try {
    const { page = 1, size = 10 } = query;
    const { limit, offset } = getPagination(page, size);
    let allRecords = await vehicleCategories.findAndCountAll({
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
