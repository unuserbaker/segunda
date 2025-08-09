const { httpError, httpSend } = require("../../../common/utils/httpResponses");
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
      plate,
      engineTypeId,
      typeId,
      transmissionId,
      sellerId,
      statusId,
    } = req.body;

    const createVehicle = await vehiclesSrv.createOrUpdate({
      category_id: categoryId,
      brand_id: brandId,
      price,
      mileage,
      plate,
      engine_type_id: engineTypeId,
      type_id: typeId,
      transmission_id: transmissionId,
      seller_id: sellerId,
      status_id: statusId,
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
    const { id } = req.params;
    
    const {
      categoryId,
      brandId,
      price,
      mileage,
      plate,
      engineTypeId,
      typeId,
      transmissionId,
      sellerId,
      statusId,
    } = req.body;

    // Crear un objeto con los valores que no sean undefined
    const updatedData = { id }; // Asegúrate de incluir el ID del vehículo

    // Solo incluir los campos que se pasan en la solicitud
    if (categoryId !== undefined) updatedData.category_id = categoryId;
    if (brandId !== undefined) updatedData.brand_id = brandId;
    if (price !== undefined) updatedData.price = price;
    if (mileage !== undefined) updatedData.mileage = mileage;
    if (plate !== undefined) updatedData.plate = plate;
    if (engineTypeId !== undefined) updatedData.engine_type_id = engineTypeId;
    if (typeId !== undefined) updatedData.type_id = typeId;
    if (transmissionId !== undefined) updatedData.transmission_id = transmissionId;
    if (sellerId !== undefined) updatedData.seller_id = sellerId;
    if (statusId !== undefined) updatedData.status_id = statusId;

    // Si no hay datos para actualizar, devuelve un error
    if (Object.keys(updatedData).length === 1) { // Solo contiene el ID
      return httpError(res, 'No se enviaron datos para actualizar.', 400);
    }

    // Realizar la actualización
    const updatedVehicle = await vehiclesSrv.createOrUpdate(updatedData);

    httpSend(res, { updated: true, vehicle: updatedVehicle }, messages.SUCCESS);
  } catch (error) {
    httpError(res, error.message, 500);
  }
};