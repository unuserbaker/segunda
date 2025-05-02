import { useMemo, useState } from 'react';
import * as Yup from 'Yup';

const useCreateVehicle = ({ vehicle }) => {

  const initialValues = {
    idVehicle: vehicle?.vehicle_id || '',
    idCategory: vehicle?.category_id || '',
    idBrand: vehicle?.brand_id || '',
    price: vehicle?.price || '',
    milieage: vehicle?.mileage || '',
    engineType: vehicle?.engine_type_id || '',
    vehicleType: vehicle?.vehicle_type_id || '',
    idTransmission: vehicle?.transmission_id || '',
    idSeller: vehicle?.seller_id || '',
  };
  
  const validationSchema = Yup.object().shape({
    idCategory: Yup.string().required('La categoria es requerida'),
    idBrand: Yup.string().required('La marca es requerida'),
    price: Yup.number().required(
      'El precio del vehiculo es requerido'
    ),
    milieage: Yup.number().required('El kilometraje es requerido'),
    engineType: Yup.string().required('El tipo de ingenieria es requerido'),
    vehicleType: Yup.string().required('El tipo de vehiculo es requerido'),
    idTransmission: Yup.string().required('La transmision es requerida'),
    idSeller: Yup.string().required('La marca es requerida'),
    // status: Yup.string().required('El estado es requerido'),
  });

  return {
    initialValues,
    validationSchema
  };
}

export default useCreateVehicle;