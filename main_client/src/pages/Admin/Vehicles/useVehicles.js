import { getVehicles } from '@/core/services/vehicles_service/vehicles.js';
import { ROUTE_IDS } from '@/utils/vars';
import EditIcon from '@mui/icons-material/Edit';
import {
  createVehicle,
  updateVehicle,
} from '@/core/services/vehicles_service/vehicles.js';
import { useState } from 'react';
import { useRouteLoaderData, useLoaderData } from 'react-router-dom';

const formatVehiclesData = (vehicles = []) => {
  return vehicles.map((vehicle) => ({
    ...vehicle,
  }));
};

const useVehicles = () => {
  const {
    vehicles,
    types,
    transmissions,
    categories,
    brands,
    status,
    engineTypes,
  } = useLoaderData();
  const { colors } = useRouteLoaderData(ROUTE_IDS.ADMIN);

  const [modalShow, setModalShow] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [vehiclesList, setVehicleList] = useState(formatVehiclesData(vehicles));

  const handleModal = (modalName) => {
    setModalShow(modalName);
  };

  const handleListVehicles = async () => {
    try {
      const { record } = await getVehicles();
      setVehicleList(formatVehiclesData(record.rows));
    } catch (error) {
      console.log(error?.message, 'error');
    }
  };
  const handleSubmitVehicleCrear = async (values) => {
    try {
      await createVehicle(values);
      await handleListVehicles(); // 🔄 Refrescar lista
      handleModal(null); // Cerrar modal
    } catch (error) {
      console.error('Error creando vehículo:', error.message);
    }
  };

  const handleSubmitVehicleEdit = async (values) => {
    try {
      await updateVehicle(values.id, values);
      await handleListVehicles(); // 🔄 Refrescar lista
      handleModal(null);
    } catch (error) {
      console.error('Error editando vehículo:', error.message);
    }
  };

  const headerTable = [
    { key: 'id', name: 'ID Vehiculo' },
    { key: 'category_id', name: 'Categoria' },
    { key: 'brand_id', name: 'Marca' },
    { key: 'price', name: 'Precio' },
    { key: 'mileage', name: 'Kilometraje' },
    { key: 'plate', name: 'Placa' },
    { key: 'engine_type_id', name: 'Tipo de ingenieria' },
    { key: 'type_id', name: 'Tipo de vehiculo' },
    { key: 'transmission_id', name: 'Tipo de transmision' },
    { key: 'status_id', name: 'Estado' },
    { key: 'created_at', name: 'Fecha creación' },
    { key: 'updated_at', name: 'Fecha actualización' },
  ];

  const headerButtons = [
    {
      id: 1,
      name: 'Crear Vehiculo',
      handleClick: () => handleModal('vehiculo-crear'),
      color: 'primary',
      disabled: false,
    },
  ];

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
    types,
    transmissions,
    categories,
    brands,
    status,
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
      disabled: false,
    },
  };
};

export default useVehicles;
