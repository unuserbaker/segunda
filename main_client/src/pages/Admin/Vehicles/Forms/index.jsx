import { Form, Formik } from 'formik';
import useCreateVehicle from './useCreateVehicle.jsx';
import { Grid } from '@mui/material';
import CustomTextField from '@/shared/Components/Inputs/CustomTextfield';
import CustomSelect from '@/shared/Components/Inputs/CustomSelect';
import CustomButton from '@/shared/Components/Inputs/CustomButton';

const FormVehicle = ({ vehicle, onSubmit, types, transmissions, categories, brands, engineTypes, status }) => {
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
      {({ handleChange, values, errors }) => {
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
                  id="typeId"
                  name="typeId"
                  value={values.typeId}
                  onChange={handleChange}
                  options={types.map(({ id, name }) => ({
                    value: id,
                    label: name,
                  }))}
                  error={!!errors.typeId}
                />
              </Grid>
              <Grid item xs={6}>
                <CustomSelect
                  labelId="Tipo de transmision"
                  label="Tipo de transmision"
                  id="transmissionId"
                  name="transmissionId"
                  value={values.transmissionId}
                  onChange={handleChange}
                  options={transmissions.map(({ id, name }) => ({
                    value: id,
                    label: name,
                  }))}
                  error={!!errors.transmissionId}
                />
              </Grid>
              <Grid item xs={6}>
                <CustomSelect
                  labelId="Categoria del vehiculo"
                  label="Categoria del vehiculo"
                  id="categoryId"
                  name="categoryId"
                  value={values.categoryId}
                  onChange={handleChange}
                  options={categories.map(({ id, name }) => ({
                    value: id,
                    label: name,
                  }))}
                  error={!!errors.categoryId}
                />
              </Grid>
              <Grid item xs={6}>
                <CustomSelect
                  labelId="Marcas"
                  label="Marcas"
                  id="brandId"
                  name="brandId"
                  value={values.brandId}
                  onChange={handleChange}
                  options={brands.map(({ id, name }) => ({
                    value: id,
                    label: name,
                  }))}
                  error={!!errors.brandId}
                />
              </Grid>
              <Grid item xs={6}>
                <CustomSelect
                  labelId="Tipo de Ingenieria"
                  label="Tipo de Ingenieria"
                  id="engineTypeId"
                  name="engineTypeId"
                  value={values.engineTypeId}
                  onChange={handleChange}
                  options={engineTypes.map(({ id, name }) => ({
                    value: id,
                    label: name,
                  }))}
                  error={!!errors.engineTypeId}
                />
              </Grid>
              <Grid item xs={6}>
                <CustomTextField
                  label="Kilometraje"
                  name="mileage"
                  type="text"
                  error={!!errors.mileage}
                  value={values.mileage}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <CustomTextField
                  label="Placa"
                  name="plate"
                  type="text"
                  error={!!errors.plate}
                  value={values.plate}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <CustomTextField
                  label="price"
                  name="price"
                  type="text"
                  error={!!errors.price}
                  value={values.price}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <CustomSelect
                  labelId="Estado"
                  label="Estado"
                  id="statusId"
                  name="statusId"
                  value={values.statusId}
                  onChange={handleChange}
                  options={status.map(({ id, name }) => ({
                    value: id,
                    label: name,
                  }))}
                  error={!!errors.statusId}
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

export default FormVehicle; 