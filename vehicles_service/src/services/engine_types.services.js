const { getPagination, getPagingData } = require("../../../common/utils/pagination");

const engineTypes = require("#M/engine_types.model");

exports.get = async (query) => {
  try {
    const { page = 1, size = 10 } = query;
    const { limit, offset } = getPagination(page, size);
    let allRecords = await engineTypes.findAndCountAll({
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
