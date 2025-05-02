const { httpError, httpSend } = require("#H/httpResponses");

const vehicleCategories = require("#M/vehicle_categories.model");

exports.list = async (req, res) => {
  try {
    const data = await vehicleCategories.findAll({});

    httpSend(
      res,
      data.map((el) => el.toJSON()),
      "success"
    );
  } catch (error) {
    httpError(res, error.message, 500);
  }
};
