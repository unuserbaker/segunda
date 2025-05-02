import { getVehicles } from '@/core/services/vehicles_service/vehicles.js';
import { ROUTE_IDS } from '@/utils/vars';
import EditIcon from '@mui/icons-material/Edit';
import { createVehicle, updateVehicle } from '@/core/services/vehicles_service/vehicles.js';
import { useState, useEffect } from 'react';
import { useRouteLoaderData, useLoaderData } from 'react-router-dom';

const formatVehiclesData = (vehicles) => {
  return vehicles.map((vehicle) => ({
    ...vehicle,
  }));
};

const useVehicles = () => {
  const { vehicles, vehicleTypes, vehicleTransmissions, vehicleCategories, vehicleBrands, engineTypes } = useLoaderData();
  const { colors } = useRouteLoaderData(ROUTE_IDS.ADMIN);

  const [modalShow, setModalShow] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [vehiclesList, setVehicleList] = useState(
    formatVehiclesData(vehicles)
  );

  const handleModal = (modalName) => {
    setModalShow(modalName);
  };

  const handleDataVehicle = (data = null) => {
    setVehicle(data);
    handleModal('vehicle');
  };

  const handleListVehicles = async () => {
    try {
      const { records } = await getVehicles();
      setVehicleList(formatVehiclesData(records || vehicles || []));
    } catch (error) {
      console.log(error?.message, 'error');
    }
  };

  const handleSubmitVehicleCrear = async (values) => {
  }

  const handleSubmitVehicleEdit = async (values) => {
  };

  const headerTable = [
    { key: 'vehicle_id', name: 'ID Vehiculo' },
    { key: 'category_id', name: 'Categoria' },
    { key: 'brand_id', name: 'Marca' },
    { key: 'price', name: 'Precio' },
    { key: 'mileage', name: 'Kilometraje' },
    { key: 'engine_type_id', name: 'Tipo de ingenieria' },
    { key: 'vehicle_type_id', name: 'Tipo de vehiculo' },
    { key: 'transmission_id', name: 'Tipo de transmision' },
    { key: 'createdAt', name: 'Fecha creación' },
    { key: 'updatedAt', name: 'Fecha actualización' },
  ];

  const headerButtons = [{
    id: 1,
    name: 'Crear Vehiculo',
    handleClick: () => handleModal('vehiculo-crear'),
    color: 'primary',
    disabled: false,
  },];

  const actionButtons = {
    title: 'Acciones',
    buttons: () => [
      {
        id: 1,
        name: 'Editar',
        handleClick: (index) => {
          setVehicle(vehiclesList[index]);
          handleModal('Editar');
        },
        icon: EditIcon,
        color: 'primary',
      },
    ],
  };

  return {
    vehicle,
    modalShow,
    colors,
    vehicleTypes,
    vehicleTransmissions,
    vehicleCategories,
    vehicleBrands,
    engineTypes,
    handleListVehicles,
    handleModal,
    handleSubmitVehicleCrear,
    handleSubmitVehicleEdit,
    table: {
      headerButtons,
      headerTable,
      actionButtons,
      tableBodyData: vehiclesList,
      pagination: true,
      inputFilter: true,
    },
  };
};

export default useVehicles;
