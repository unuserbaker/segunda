const { httpError, httpSend } = require("#H/httpResponses");

const vehicleTransmissions = require("#M/vehicle_transmissions.model");

exports.list = async (req, res) => {
  try {
    const data = await vehicleTransmissions.findAll({});

    httpSend(
      res,
      data.map((el) => el.toJSON()),
      "success"
    );
  } catch (error) {
    httpError(res, error.message, 500);
  }
};
