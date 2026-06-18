import { Grid, Box } from '@mui/material';
import { json } from 'react-router-dom';

import useVehicles from './useVehicles.js';
import TableActionComponent from '@/shared/Components/Tables/CustomTable';
import { getVehicles } from '@/core/services/vehicles_service/vehicles.js';
import { throwErrorPage } from '@/utils/functions';
import CustomModal from '@/shared/Components/Modal/CustomModal/index.jsx';
import FormVehicle from './Forms/index.jsx';
import { getTypes } from '@/core/services/vehicles_service/type.js';
import { getTransmissions } from '@/core/services/vehicles_service/transmissions.js';
import { getCategories } from '@/core/services/vehicles_service/categories.js';
import { getBrands } from '@/core/services/vehicles_service/brands.js';
import { getEngineTypes } from '@/core/services/vehicles_service/engine_types.js';
import { getStatus } from '@/core/services/vehicles_service/status.js';
import TitleText from '@/shared/Components/Others/TitleText';

export const loader = async () => {
  try {
    const [
      vehiclesResponse,
      typesResponse,
      transmissionsResponse,
      categoriesResponse,
      brandsResponse,
      statusResponse,
      engineTypesResponse,
    ] = await Promise.all([
      getVehicles(),
      getTypes(),
      getTransmissions(),
      getCategories(),
      getBrands(),
      getStatus(),
      getEngineTypes(),
    ]);

    const vehicles = vehiclesResponse.record.rows;
    const types = typesResponse.record.rows;
    const transmissions = transmissionsResponse.record.rows;
    const categories = categoriesResponse.record.rows;
    const brands = brandsResponse.record.rows;
    const status = statusResponse.record.rows;
    const engineTypes = engineTypesResponse.record.rows;

    return json({
      vehicles,
      types,
      transmissions,
      categories,
      brands,
      status,
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
  console.log('Renderizando VehiclesPage...');
  const {
    vehicle,
    modalShow,
    colors,
    types,
    transmissions,
    categories,
    brands,
    status,
    engineTypes,
    handleModal,
    handleSubmitVehicleCrear,
    handleSubmitVehicleEdit,
    table,
  } = useVehicles();
  console.log('Datos cargados:', {
    vehicle,
    modalShow,
    colors,
    types,
    transmissions,
    categories,
    brands,
    status,
    engineTypes,
    table,
  });
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
        <FormVehicle
          onSubmit={handleSubmitVehicleCrear}
          types={types}
          transmissions={transmissions}
          categories={categories}
          brands={brands}
          engineTypes={engineTypes}
          status={status}
        />
      </CustomModal>
      <CustomModal
        open={modalShow === 'Editar'}
        onClose={() => handleModal(null)}
        title={'Editar vehiculo'}
      >
        <FormVehicle
          vehicle={vehicle}
          onSubmit={handleSubmitVehicleEdit}
          types={types}
          transmissions={transmissions}
          categories={categories}
          brands={brands}
          engineTypes={engineTypes}
          status={status}
        />
      </CustomModal>
    </section>
  );
};

export default VehiclesPage;
