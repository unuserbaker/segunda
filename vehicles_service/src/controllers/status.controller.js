const { httpError, httpSend } = require("#H/httpResponses");
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
