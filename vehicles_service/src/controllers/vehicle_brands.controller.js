const { httpError, httpSend } = require("#H/httpResponses");
const { messages } = require("#H/utils");

const vehicleBrands = require("#M/vehicle_brands.model");

exports.list = async (req, res) => {
  try {
    const data = await vehicleBrands.findAll({});

    httpSend(
      res,
      data.map((el) => el.toJSON()),
      "success"
    );
  } catch (error) {
    httpError(res, error.message, 500);
  }
};

exports.create = async (req, res) => {
  try {
    const { name, code, status } = req.body;
    const createBrand = await Vehicles.create({
      name,
      strCode: code,
      status,
    });
    if (!createBrand) throw new Error(messages.CREATE_ERROR("marca"));

    httpSend(res, createBrand, messages.CREATE_SUCCESS);
  } catch {
    httpError(res, error.message, 500);
  }
};
