import { json, redirect, useNavigation } from 'react-router-dom';
import { ErrorMessage, Form, Formik } from "formik";
import { TextField, Box, Typography, InputAdornment, IconButton, MenuItem, Grid } from "@mui/material";
import PersonIcon from '@mui/icons-material/Person';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import CustomButton from "@/shared/Components/Inputs/CustomButton/index.jsx";
import LoadingComponent from '@C/Loading/index.jsx';
import ModalForgetPassword from "./modal/ModalForgetPassword.jsx";
import useLogin from "./useLogin.js";
import { getInfoTokenUserLogged } from '@/utils/functions';

export const loader = async () => {
    const tkn = await getInfoTokenUserLogged();
    if (tkn) {
        const { lay } = tkn;
        return redirect(`/${lay}/dashboard`);
    }
    return json({
        colors: {
            primary: 'success',
            HxPrimary: '#4caf50',
            secondary: 'secondary',
            HSecondary: '#ba68c8',
        },
    });
};

const LoginPage = () => {
    const navigation = useNavigation();
    const {
        initialValuesLoginForm,
        showPassword,
        handleClickShowPassword,
        handleMouseDownPassword,
        handleSubmit,
        showModalPass,
        closeModalPassword,
        validationSchemaLoginForm,
    } = useLogin();

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
                            Inicio de Sesión
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={12}>
                        <Formik
                            enableReinitialize={false}
                            initialValues={initialValuesLoginForm}
                            validationSchema={validationSchemaLoginForm}
                            onSubmit={async (values) => await handleSubmit(values)}
                        >
                            {({
                                values,
                                isSubmitting,
                                handleChange,
                            }) => {
                                return (
                                    <Form>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={12}>
                                                <TextField
                                                    fullWidth
                                                    id="email"
                                                    label="Correo"
                                                    name="email"
                                                    value={values.email}
                                                    onChange={(e) => {
                                                        return handleChange(e);
                                                    }}
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
                                                    <ErrorMessage name="email" />
                                                </div>
                                            </Grid>
                                            <Grid item xs={12} md={12}>
                                                <TextField
                                                    margin="normal"
                                                    fullWidth
                                                    name="password"
                                                    value={values.contrasenna}
                                                    onChange={handleChange}
                                                    label="Contraseña"
                                                    type={showPassword ? 'text' : 'password'}
                                                    id="password"
                                                    autoComplete="current-password"
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
                                                    <ErrorMessage name="contrasenna" />
                                                </div>
                                            </Grid>
                                        </Grid>
                                        <Grid container spacing={2} sx={{ marginTop: 2 }}>

                                            <Grid item xs={12} md={12}>
                                                <CustomButton
                                                    disabled={!values.email || !values.password || isSubmitting}
                                                    submitting={isSubmitting}
                                                    color={'warning'}
                                                    fullWidth={true}
                                                    type={'button'}
                                                    onClick={async () =>
                                                        await handleSubmit()
                                                    }
                                                >
                                                    Iniciar Sesión
                                                </CustomButton>
                                            </Grid>
                                        </Grid>
                                    </Form>
                                );
                            }}
                        </Formik>
                    </Grid>
                </Grid>
                <Grid
                    container
                    spacing={2}
                    sx={{ marginBottom: '20px', marginTop: '10px' }}
                >
                    <Grid item xs={12}>
                    </Grid>
                    <Grid item></Grid>
                </Grid>
            </Box>
            <ModalForgetPassword open={showModalPass} onClose={closeModalPassword} />
        </section>
    );
}
export default LoginPage;