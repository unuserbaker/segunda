const { httpError, httpSend } = require("#H/httpResponses");

const vehicleTypes = require("#M/vehicle_types.model");

exports.list = async (req, res) => {
  try {
    const data = await vehicleTypes.findAll({});

    httpSend(
      res,
      data.map((el) => el.toJSON()),
      "success"
    );
  } catch (error) {
    httpError(res, error.message, 500);
  }
};
