const { httpError, httpSend } = require("#H/httpResponses");
const { messages } = require("#H/utils");
const vehicleBrandService = require("#S/vehicle_brands.services");

exports.list = async (req, res) => {
  try {
    const data = await vehicleBrandService.get(req.query);

    httpSend(
      res,
      data,
      "success"
    );
  } catch (error) {
    httpError(res, error.message, 500);
  }
};

// exports.create = async (req, res) => {
//   try {
//     const { name, code, status } = req.body;
//     const createBrand = await Vehicles.create({
//       name,
//       str_code: code,
//       status,
//     });
//     if (!createBrand) throw new Error(messages.CREATE_ERROR("marca"));

//     httpSend(res, createBrand, messages.CREATE_SUCCESS);
//   } catch {
//     httpError(res, error.message, 500);
//   }
// };
