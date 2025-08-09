const { httpError, httpSend } = require("../../../common/utils/httpResponses");
const statusService = require("#S/status.services");

exports.list = async (req, res) => {
  try {
    const data = await statusService.get(req.query);

    httpSend(
      res,
      data,
      "success"
    );
  } catch (error) {
    httpError(res, error.message, 500);
  }
};
