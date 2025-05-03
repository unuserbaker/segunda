const { httpError, httpSend } = require("#H/httpResponses");
const vehicleCategoriesService = require("#S/vehicle_categories.services");

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
