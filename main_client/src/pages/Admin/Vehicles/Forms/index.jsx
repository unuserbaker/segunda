import { Form, Formik, ErrorMessage } from 'formik';
import useCreateVehicle from './useCreateVehicle.jsx';
import { Alert, CircularProgress, Grid } from '@mui/material';
import CustomTextField from '@/shared/Components/Inputs/CustomTextfield';
import { useEffect } from 'react';
import CustomSelect from '@/shared/Components/Inputs/CustomSelect';
import CustomButton from '@/shared/Components/Inputs/CustomButton';

const FormCreate = ({ vehicle, onSubmit, vehicleTypes, vehicleTransmissions, vehicleCategories, vehicleBrands, engineTypes }) => {
  const {
    initialValues,
    validationSchema,
  } = useCreateVehicle({ vehicle });

  return (
    <Formik
      validateOnChange
      validateOnBlur
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={async (values) => {
        await onSubmit(values);
      }}
    >
      {({ handleChange, values, errors, setFieldValue }) => {
        return (
          <Form>
            <Grid
              container
              justifyContent="center"
              spacing={2}
              sx={{ marginTop: '10px' }}
            >
              <Grid item xs={6}>
                <CustomSelect
                  labelId="Tipo del vehiculo"
                  label="Tipo del vehiculo"
                  id="vehicleType"
                  name="vehicleType"
                  value={values.vehicleType}
                  onChange={handleChange}
                  options={vehicleTypes.map(({ vehicle_type_id, name }) => ({
                    value: vehicle_type_id,
                    label: name,
                  }))}
                  error={!!errors.vehicleType}
                />
              </Grid>
              <Grid item xs={6}>
                <CustomSelect
                  labelId="Tipo de transmision"
                  label="Tipo de transmision"
                  id="idTransmission"
                  name="idTransmission"
                  value={values.idTransmission}
                  onChange={handleChange}
                  options={vehicleTransmissions.map(({ transmission_id, name }) => ({
                    value: transmission_id,
                    label: name,
                  }))}
                  error={!!errors.idTransmission}
                />
              </Grid>
              <Grid item xs={6}>
                <CustomSelect
                  labelId="Categoria del vehiculo"
                  label="Categoria del vehiculo"
                  id="idCategory"
                  name="idCategory"
                  value={values.idCategory}
                  onChange={handleChange}
                  options={vehicleCategories.map(({ category_id, name }) => ({
                    value: category_id,
                    label: name,
                  }))}
                  error={!!errors.idCategory}
                />
              </Grid>
              <Grid item xs={6}>
                <CustomSelect
                  labelId="Marcas"
                  label="Marcas"
                  id="idBrand"
                  name="idBrand"
                  value={values.idBrand}
                  onChange={handleChange}
                  options={vehicleBrands.map(({ brand_id, name }) => ({
                    value: brand_id,
                    label: name,
                  }))}
                  error={!!errors.idBrand}
                />
              </Grid>
              <Grid item xs={6}>
                <CustomSelect
                  labelId="Tipo de Ingenieria"
                  label="Tipo de Ingenieria"
                  id="engineType"
                  name="engineType"
                  value={values.engineType}
                  onChange={handleChange}
                  options={engineTypes.map(({ engine_type_id, name }) => ({
                    value: engine_type_id,
                    label: name,
                  }))}
                  error={!!errors.engineType}
                />
              </Grid>
              <Grid item xs={6}>
                <CustomTextField
                  label="Kilometraje"
                  name="milieage"
                  type="text"
                  error={!!errors.milieage}
                  value={values.milieage}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <CustomTextField
                  label="precio"
                  name="price"
                  type="text"
                  error={!!errors.price}
                  value={values.price}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>

              <Grid
                container
                spacing={2}
                xs={12}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  marginTop: 1,
                }}
              >
                <Grid item xs={6}>
                  <CustomButton
                    fullWidth
                    variant="contained"
                    type="submit"
                  >
                    {vehicle ? 'Editar' : 'Crear'}
                  </CustomButton>
                </Grid>
              </Grid>
            </Grid>
          </Form>
        );
      }}
    </Formik>
  );
};

export default FormCreate; 