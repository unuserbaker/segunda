const { httpError, httpSend } = require("../../../common/utils/httpResponses");
const engineTypesService = require("#S/engine_types.services");

exports.list = async (req, res) => {
  try {
    const data = await engineTypesService.get(req.query);

    httpSend(
      res,
      data,
      "success"
    );
  } catch (error) {
    httpError(res, error.message, 500);
  }
};
