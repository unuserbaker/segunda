import { json, useNavigation } from 'react-router-dom';
import { ErrorMessage, Form, Formik } from 'formik';
import {
    TextField,
    Box,
    Typography,
    InputAdornment,
    IconButton,
    Grid,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import BusinessIcon from '@mui/icons-material/Business';
import PhoneIcon from '@mui/icons-material/Phone';
import BadgeIcon from '@mui/icons-material/Badge';
import CustomButton from '@/shared/Components/Inputs/CustomButton/index.jsx';
import LoadingComponent from '@C/Loading/index.jsx';
import useRegister from './useRegister.js';

export const loader = async () => {
    return json({
        colors: {
            primary: 'success',
            HxPrimary: '#4caf50',
            secondary: 'secondary',
            HSecondary: '#ba68c8',
        },
    });
};

const RegisterPage = () => {
    const navigation = useNavigation();
    const {
        initialValuesRegisterForm,
        validationSchemaRegisterForm,
        showPassword,
        showConfirmPassword,
        handleClickShowPassword,
        handleClickShowConfirmPassword,
        handleMouseDownPassword,
        handleSubmit,
        registeredSuccessfully,
        goToLogin,
    } = useRegister();

    if (navigation.state === 'loading') return <LoadingComponent />;

    return (
        <section>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: '10px',
                    paddingTop: '10px',
                    backgroundColor: '#ffffff',
                    paddingBottom: '60px',
                    height: '100vh',
                    padding: '20%',
                }}
            >
                <Grid container spacing={2}>
                    <Grid item xs={12} md={12}>
                        <Typography
                            component="h1"
                            variant="h5"
                            style={{ color: '#242629', paddingBottom: '20px' }}
                        >
                            Crear cuenta
                        </Typography>
                    </Grid>
                    {registeredSuccessfully ? (
                        <Grid item xs={12} md={12}>
                            <Typography style={{ color: '#242629', marginBottom: '20px' }}>
                                ¡Registro exitoso! Ya puedes iniciar sesión con tu correo y
                                contraseña.
                            </Typography>
                            <CustomButton
                                fullWidth={true}
                                type={'button'}
                                color={'warning'}
                                onClick={goToLogin}
                            >
                                Ir a iniciar sesión
                            </CustomButton>
                        </Grid>
                    ) : (
                        <Grid item xs={12} md={12}>
                            <Formik
                                enableReinitialize={false}
                                initialValues={initialValuesRegisterForm}
                                validationSchema={validationSchemaRegisterForm}
                                onSubmit={async (values) => await handleSubmit(values)}
                            >
                                {({ values, isSubmitting, handleChange }) => {
                                    return (
                                        <Form>
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} md={12}>
                                                    <FormControl>
                                                        <FormLabel id="role-label">
                                                            Quiero registrarme como
                                                        </FormLabel>
                                                        <RadioGroup
                                                            row
                                                            aria-labelledby="role-label"
                                                            name="role"
                                                            value={values.role}
                                                            onChange={handleChange}
                                                        >
                                                            <FormControlLabel
                                                                value="buyer"
                                                                control={<Radio />}
                                                                label="Comprador"
                                                            />
                                                            <FormControlLabel
                                                                value="seller"
                                                                control={<Radio />}
                                                                label="Vendedor / Concesionaria"
                                                            />
                                                        </RadioGroup>
                                                    </FormControl>
                                                </Grid>
                                                <Grid item xs={12} md={12}>
                                                    <TextField
                                                        fullWidth
                                                        id="name"
                                                        label="Nombre"
                                                        name="name"
                                                        value={values.name}
                                                        onChange={handleChange}
                                                        autoFocus
                                                        InputProps={{
                                                            startAdornment: (
                                                                <InputAdornment position="start">
                                                                    <PersonIcon style={{ color: '#242629' }} />
                                                                </InputAdornment>
                                                            ),
                                                        }}
                                                    />
                                                    <div className="error1" style={{ width: '100%' }}>
                                                        <ErrorMessage name="name" />
                                                    </div>
                                                </Grid>
                                                <Grid item xs={12} md={12}>
                                                    <TextField
                                                        fullWidth
                                                        id="email"
                                                        label="Correo"
                                                        name="email"
                                                        value={values.email}
                                                        onChange={handleChange}
                                                        InputProps={{
                                                            startAdornment: (
                                                                <InputAdornment position="start">
                                                                    <EmailIcon style={{ color: '#242629' }} />
                                                                </InputAdornment>
                                                            ),
                                                        }}
                                                    />
                                                    <div className="error1" style={{ width: '100%' }}>
                                                        <ErrorMessage name="email" />
                                                    </div>
                                                </Grid>
                                                {values.role === 'seller' && (
                                                    <>
                                                        <Grid item xs={12} md={12}>
                                                            <TextField
                                                                fullWidth
                                                                id="businessName"
                                                                label="Razón social"
                                                                name="businessName"
                                                                value={values.businessName}
                                                                onChange={handleChange}
                                                                InputProps={{
                                                                    startAdornment: (
                                                                        <InputAdornment position="start">
                                                                            <BusinessIcon style={{ color: '#242629' }} />
                                                                        </InputAdornment>
                                                                    ),
                                                                }}
                                                            />
                                                            <div className="error1" style={{ width: '100%' }}>
                                                                <ErrorMessage name="businessName" />
                                                            </div>
                                                        </Grid>
                                                        <Grid item xs={12} md={12}>
                                                            <TextField
                                                                fullWidth
                                                                id="taxId"
                                                                label="NIT / RUT"
                                                                name="taxId"
                                                                value={values.taxId}
                                                                onChange={handleChange}
                                                                InputProps={{
                                                                    startAdornment: (
                                                                        <InputAdornment position="start">
                                                                            <BadgeIcon style={{ color: '#242629' }} />
                                                                        </InputAdornment>
                                                                    ),
                                                                }}
                                                            />
                                                            <div className="error1" style={{ width: '100%' }}>
                                                                <ErrorMessage name="taxId" />
                                                            </div>
                                                        </Grid>
                                                        <Grid item xs={12} md={12}>
                                                            <TextField
                                                                fullWidth
                                                                id="phone"
                                                                label="Teléfono"
                                                                name="phone"
                                                                value={values.phone}
                                                                onChange={handleChange}
                                                                InputProps={{
                                                                    startAdornment: (
                                                                        <InputAdornment position="start">
                                                                            <PhoneIcon style={{ color: '#242629' }} />
                                                                        </InputAdornment>
                                                                    ),
                                                                }}
                                                            />
                                                            <div className="error1" style={{ width: '100%' }}>
                                                                <ErrorMessage name="phone" />
                                                            </div>
                                                        </Grid>
                                                    </>
                                                )}
                                                <Grid item xs={12} md={12}>
                                                    <TextField
                                                        margin="normal"
                                                        fullWidth
                                                        name="password"
                                                        value={values.password}
                                                        onChange={handleChange}
                                                        label="Contraseña"
                                                        type={showPassword ? 'text' : 'password'}
                                                        id="password"
                                                        autoComplete="new-password"
                                                        InputProps={{
                                                            startAdornment: (
                                                                <InputAdornment position="start">
                                                                    <LockOutlinedIcon
                                                                        style={{ color: '#242629' }}
                                                                    />
                                                                </InputAdornment>
                                                            ),
                                                            endAdornment: (
                                                                <InputAdornment position="end">
                                                                    <IconButton
                                                                        aria-label="toggle password visibility"
                                                                        onClick={handleClickShowPassword}
                                                                        onMouseDown={handleMouseDownPassword}
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
                                                    <div className="error1">
                                                        <ErrorMessage name="password" />
                                                    </div>
                                                </Grid>
                                                <Grid item xs={12} md={12}>
                                                    <TextField
                                                        margin="normal"
                                                        fullWidth
                                                        name="confirmPassword"
                                                        value={values.confirmPassword}
                                                        onChange={handleChange}
                                                        label="Confirmar contraseña"
                                                        type={showConfirmPassword ? 'text' : 'password'}
                                                        id="confirmPassword"
                                                        autoComplete="new-password"
                                                        InputProps={{
                                                            startAdornment: (
                                                                <InputAdornment position="start">
                                                                    <LockOutlinedIcon
                                                                        style={{ color: '#242629' }}
                                                                    />
                                                                </InputAdornment>
                                                            ),
                                                            endAdornment: (
                                                                <InputAdornment position="end">
                                                                    <IconButton
                                                                        aria-label="toggle confirm password visibility"
                                                                        onClick={handleClickShowConfirmPassword}
                                                                        onMouseDown={handleMouseDownPassword}
                                                                    >
                                                                        {showConfirmPassword ? (
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
                                                    <div className="error1">
                                                        <ErrorMessage name="confirmPassword" />
                                                    </div>
                                                </Grid>
                                            </Grid>
                                            <Grid container spacing={2} sx={{ marginTop: 2 }}>
                                                <Grid item xs={12} md={12}>
                                                    <CustomButton
                                                        disabled={
                                                            !values.name ||
                                                            !values.email ||
                                                            !values.password ||
                                                            !values.confirmPassword ||
                                                            (values.role === 'seller' &&
                                                                (!values.businessName ||
                                                                    !values.taxId ||
                                                                    !values.phone)) ||
                                                            isSubmitting
                                                        }
                                                        submitting={isSubmitting}
                                                        color={'warning'}
                                                        fullWidth={true}
                                                        type={'button'}
                                                        onClick={async () => await handleSubmit(values)}
                                                    >
                                                        Registrarme
                                                    </CustomButton>
                                                </Grid>
                                            </Grid>
                                        </Form>
                                    );
                                }}
                            </Formik>
                        </Grid>
                    )}
                </Grid>
            </Box>
        </section>
    );
};

export default RegisterPage;
