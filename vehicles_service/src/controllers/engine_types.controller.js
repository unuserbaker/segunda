const { httpError, httpSend } = require("#H/httpResponses");
const engineTypesSrv = require("#S/engine_types.services");

exports.list = async (req, res) => {
  try {
    const data = await engineTypesSrv.get(req.query);

    httpSend(
      res,
      data,
      "success"
    );
  } catch (error) {
    httpError(res, error.message, 500);
  }
};
