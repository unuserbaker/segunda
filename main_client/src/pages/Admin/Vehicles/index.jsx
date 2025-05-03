import { Grid, Box } from '@mui/material';
import { json } from 'react-router-dom';

import useVehicles from './useVehicles.js';
import TableActionComponent from '@/shared/Components/Tables/CustomTable';
import { getVehicles } from "@/core/services/vehicles_service/vehicles.js";
import { throwErrorPage } from '@/utils/functions';
import CustomModal from '@/shared/Components/Modal/CustomModal/index.jsx';
import FormCreate from './Forms/index.jsx';
import { getVehicleTypes } from '@/core/services/vehicles_service/type.js';
import { getVehicleTransmissions } from '@/core/services/vehicles_service/transmissions.js';
import { getVehicleCategories } from '@/core/services/vehicles_service/categories.js';
import { getVehicleBrands } from '@/core/services/vehicles_service/brands.js';
import { getVehicleEngineTypes } from '@/core/services/vehicles_service/engine_types.js';
import TitleText from '@/shared/Components/Others/TitleText';

export const loader = async () => {
  try {
    const [
      vehiclesResponse,
      vehicleTypesResponse,
      vehicleTransmissionsResponse,
      vehicleCategoriesResponse,
      vehicleBrandsResponse,
      engineTypesResponse,
    ] = await Promise.all([
      getVehicles(),
      getVehicleTypes(),
      getVehicleTransmissions(),
      getVehicleCategories(),
      getVehicleBrands(),
      getVehicleEngineTypes(),
    ]);

    const vehicles = vehiclesResponse.record.rows;
    const vehicleTypes = vehicleTypesResponse.record.rows;
    const vehicleTransmissions = vehicleTransmissionsResponse.record.rows;
    const vehicleCategories = vehicleCategoriesResponse.record.rows;
    const vehicleBrands = vehicleBrandsResponse.record.rows;
    const engineTypes = engineTypesResponse.record.rows;

    return json({
      vehicles,
      vehicleTypes,
      vehicleTransmissions,
      vehicleCategories,
      vehicleBrands,
      engineTypes,
    });
  } catch (error) {
    throwErrorPage({
      status: 401,
      message: error.message,
    });
  }
};
const VehiclesPage = () => {
  const {
    vehicle,
    modalShow,
    colors,
    vehicleTypes,
    vehicleTransmissions,
    vehicleCategories,
    vehicleBrands,
    engineTypes,
    handleModal,
    handleSubmitVehicleCrear,
    handleSubmitVehicleEdit,
    table,
  } = useVehicles();
  return (
    <section>
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TitleText
              text="Configuración vehiculos"
              color={colors?.HxPrimary}
            />
          </Grid>
          <Grid item xs={12}>
            <TableActionComponent {...table} />
          </Grid>
        </Grid>
      </Box>
      <CustomModal
        open={modalShow === 'vehiculo-crear'}
        onClose={() => handleModal(null)}
        title={'Crear vehiculo'}
      >
        <FormCreate
          vehicle={vehicle}
          onSubmit={handleSubmitVehicleCrear}
          vehicleTypes={vehicleTypes}
          vehicleTransmissions={vehicleTransmissions}
          vehicleCategories={vehicleCategories}
          vehicleBrands={vehicleBrands}
          engineTypes={engineTypes}
        />
      </CustomModal>
      <CustomModal
        open={modalShow === 'Editar'}
        onClose={() => handleModal(data)}
        title={'Editar vehiculo'}
      >
        <FormCreate
          vehicle={vehicle}
          onSubmit={handleSubmitVehicleEdit}
        />
      </CustomModal>
    </section>
  );
};

export default VehiclesPage;