import * as Yup from 'Yup';

const useCreateVehicle = ({ vehicle }) => {
  const initialValues = {
    id: vehicle?.id || '',
    categoryId: vehicle?.category_id || '',
    brandId: vehicle?.brand_id || '',
    price: vehicle?.price || 0, // Asegúrate de que sea un número
    plate: vehicle?.plate || '',
    mileage: vehicle?.mileage || 0, // Asegúrate de que sea un número
    engineTypeId: vehicle?.engine_type_id || '',
    typeId: vehicle?.type_id || '',
    transmissionId: vehicle?.transmission_id || '',
    // sellerId: vehicle?.seller_id || '',
    statusId: vehicle?.status_id || '',
  };

  const validationSchema = Yup.object().shape({
    categoryId: Yup.string().required('La categoria es requerida'),
    brandId: Yup.string().required('La marca es requerida'),
    price: Yup.number()
      .required('El precio del vehiculo es requerido')
      .typeError('El precio debe ser un número válido'),
    mileage: Yup.number()
      .required('El kilometraje es requerido')
      .typeError('El kilometraje debe ser un número válido'),
    engineTypeId: Yup.string().required('El tipo de ingenieria es requerido'),
    typeId: Yup.string().required('El tipo de vehiculo es requerido'),
    transmissionId: Yup.string().required('La transmision es requerida'),
    // sellerId: Yup.string().required('EL vendedor es requerida'),
    statusId: Yup.string().required('El estado es requerido'),
  });
  return {
    initialValues,
    validationSchema,
  };
};

export default useCreateVehicle;
