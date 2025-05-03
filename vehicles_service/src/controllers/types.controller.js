const { httpError, httpSend } = require("#H/httpResponses");
const vehicleTypesService = require("#S/types.services");

exports.list = async (req, res) => {
  try {
    const data = await vehicleTypesService.get(req.query);

    httpSend(
      res,
      data,
      "success"
    );
  } catch (error) {
    httpError(res, error.message, 500);
  }
};
