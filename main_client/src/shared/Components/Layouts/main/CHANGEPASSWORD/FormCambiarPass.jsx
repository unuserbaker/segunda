import {
  Grid,
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Form, Formik } from 'formik';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import CustomButton from '@/shared/Components/Inputs/CustomButton';
import useCambiarContraseña from './useCambiarContraseña';

function Item(props) {
  return (
    <Box
      sx={{
        p: 1,
        m: 1,
        bgcolor: 'grey.100',
        color: 'black',
        border: '1px solid',
        borderColor: 'grey.300',
        borderRadius: 2,
        fontSize: '0.875rem',
        fontWeight: '700',
        ...props.sx,
      }}
      {...props}
    />
  );
}

const FormCambiarPass = () => {
  const {
    handleOnSubmit,
    showPassword,
    showPasswordConfirm,
    handleClickShowPassword,
    handleClickShowPasswordConfirm,
    initialValuesChangePassword,
    validationSchemaChangePassword,
  } = useCambiarContraseña();
  return (
    <div className="container">
      <Box
        alignItems="center"
        sx={{
          p: 7,
          flexDirection: 'column',
          backgroundColor: 'white',
          height: '100vh',
        }}
      >
        <Typography variant="h5" sx={{ color: 'black' }}>
          Cambio de Contraseña
        </Typography>
        <Formik
          validateOnChange
          validateOnBlur
          initialValues={initialValuesChangePassword}
          validationSchema={validationSchemaChangePassword}
          onSubmit={async (values) => await handleOnSubmit(values)}
        >
          {({ handleChange, values, errors, isSubmitting }) => {
            const hasErrors = Object.keys(errors).length > 0;
            return (
              <Form>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={12} sx={{ marginTop: 5 }}>
                    <TextField
                      sx={{ width: '40%' }}
                      id="old"
                      label="Actual Contraseña"
                      type={showPassword ? 'text' : 'password'}
                      name="old"
                      value={values.old}
                      onChange={handleChange}
                      autoFocus
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlinedIcon style={{ color: '#242629' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={handleClickShowPassword}
                            >
                              {showPassword ? (
                                <VisibilityOffOutlinedIcon
                                  style={{ color: '#242629' }}
                                />
                              ) : (
                                <VisibilityOutlinedIcon
                                  style={{ color: '#242629' }}
                                />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={12}>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'Column',
                        p: 1,
                        alignItems: 'center',
                      }}
                    >
                      <Item> Debe tener un caracter especial. </Item>
                      <Item> Debe tener almenos un numero. </Item>
                      <Item> Debe tener almenos una Mayuscula. </Item>
                      <Item>
                        {' '}
                        La contraseña debe tener minimo 8 Caracteres.{' '}
                      </Item>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={12}>
                    <TextField
                      margin="normal"
                      sx={{ width: '40%' }}
                      name="new"
                      value={values.new}
                      onChange={handleChange}
                      label="Nueva Contaseña"
                      type={showPasswordConfirm ? 'text' : 'password'}
                      id="new"
                      autoComplete="current-password"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlinedIcon style={{ color: '#242629' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={handleClickShowPasswordConfirm}
                            >
                              {showPasswordConfirm ? (
                                <VisibilityOffOutlinedIcon
                                  style={{ color: '#242629' }}
                                />
                              ) : (
                                <VisibilityOutlinedIcon
                                  style={{ color: '#242629' }}
                                />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
                <Grid container>
                  <Grid item xs={12} md={12}>
                    <CustomButton
                      type={'submit'}
                      disabled={hasErrors || isSubmitting}
                      submitting={isSubmitting}
                      color={'warning'}
                      fullWidth={true}
                      sx={{ width: '40%', marginTop: 5 }}
                    >
                      Continuar
                    </CustomButton>
                  </Grid>
                </Grid>
              </Form>
            );
          }}
        </Formik>
      </Box>
    </div>
  );
};

export default FormCambiarPass;
