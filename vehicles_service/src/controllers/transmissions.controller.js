const { httpError, httpSend } = require("#H/httpResponses");
const vehicleTransmissionsService = require("#S/transmissions.services");

exports.list = async (req, res) => {
  try {
    const data = await vehicleTransmissionsService.get(req.query);

    httpSend(
      res,
      data,
      "success"
    );
  } catch (error) {
    httpError(res, error.message, 500);
  }
};
