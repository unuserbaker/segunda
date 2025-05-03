const { httpError, httpSend } = require("#H/httpResponses");
const { messages } = require("#H/utils");

const vehiclesSrv = require("#S/vehicles.services");

exports.list = async (req, res) => {
  try {
    const data = await vehiclesSrv.get(req.query);

    httpSend(
      res,
      data,
      "success"
    );
  } catch (error) {
    httpError(res, error.message, 500);
  }
};

exports.create = async (req, res) => {
  try {
    const {
      categoryId,
      brandId,
      price,
      mileage,
      engineTypeId,
      vehicleTypeId,
      transmissionId,
      sellerId,
      statusId,
    } = req.body;
    
    const createVehicle = await vehiclesSrv.create({
      category_id: categoryId,
      brand_id: brandId,
      price,
      mileage,
      engine_type_id: engineTypeId,
      vehicle_type_id: vehicleTypeId,
      transmission_id: transmissionId,
      seller_id: sellerId,
      status: statusId,
    });
    if (!createVehicle) throw new Error(messages.CREATE_ERROR("vehiculo"));

    httpSend(res, createVehicle, messages.SUCCESS);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return httpError(res, messages.DATA_DUPLICATED("vehiculo"), 409);
    }
    httpError(res, error.message, 500);
  }
};

exports.update = async (req, res) => {
  try {
    const { idVehicle } = req.params;
    const {
      idCategory,
      idBrand,
      price,
      milieage,
      engineType,
      vehicleType,
      idTransmission,
      idSeller,
    } = req.body;
    const updateVehicle = await Vehicles.update(
      {
        category_id: idCategory,
        brand_id: idBrand,
        price,
        milieage,
        engine_type_id: engineType,
        vehicle_type_id: vehicleType,
        transmission_id: idTransmission,
        seller_id: idSeller,
      },
      {
        where: { vehicle_id: idVehicle },
      }
    );
    if (!updateVehicle) throw new Error(messages.DATA_EDITADO("vehiculo"));

    httpSend(res, updateVehicle, messages.SUCCESS);
  } catch {
    httpError(res, error.message, 500);
  }
};
