const { httpError, httpSend } = require("../../../common/utils/httpResponses");
const vehicleCategoriesService = require("#S/categories.services");

exports.list = async (req, res) => {
  try {
    const data = await vehicleCategoriesService.get(req.query);

    httpSend(
      res,
      data,
      "success"
    );
  } catch (error) {
    httpError(res, error.message, 500);
  }
};
