import { Grid } from '@mui/material';
import { Form, Formik, ErrorMessage } from 'formik';

import CustomModal from '@/shared/Components/Modal/CustomModal/index.jsx';
import CustomButton from '@/shared/Components/Inputs/CustomButton/index.jsx';
import CustomTextField from '@/shared/Components/Inputs/CustomTextfield/index.jsx';
import useModalForgetPassword from './useModalForgetPassword.jsx';

const ModalForgetPassword = ({ open, onClose }) => {
    const { handleSubmit, initialValuesForgetForm, validationSchema } =
        useModalForgetPassword();

    return (
        <CustomModal open={open} onClose={onClose} title={"Recuperar Contraseña"} titleColor='black'
        >
            <Formik
                validateOnChange
                validateOnBlur
                initialValues={initialValuesForgetForm}
                validationSchema={validationSchema}
                onSubmit={async (values, { resetForm }) => {
                    await handleSubmit(values, resetForm)
                }}
            >
                {({ handleChange, values, errors, isSubmitting }) => {
                    return (
                        <Form>
                            <Grid container spacing={2} sx={{ marginTop: '10px' }}>
                                <Grid item xs={12}>
                                    <CustomTextField
                                        label="Usuario"
                                        name="usuario"
                                        type="text"
                                        error={errors.usuario}
                                        value={values.usuario}
                                        onChange={handleChange}
                                        fullWidth
                                    />
                                    <div className="error1" style={{ color: 'red' }}>
                                        <ErrorMessage name="usuario" />
                                    </div>
                                </Grid>
                                <Grid item xs={12}>
                                    <CustomTextField
                                        label="Documento"
                                        name="numeroDocumento"
                                        type="number"
                                        error={errors.numeroDocumento}
                                        value={values.numeroDocumento}
                                        onChange={handleChange}
                                        fullWidth
                                    />
                                    <div className="error1" style={{ color: 'red' }}>
                                        <ErrorMessage name="numeroDocumento" />
                                    </div>
                                </Grid>
                            </Grid>
                            <Grid container spacing={2} sx={{ marginTop: 10 }}>
                                <Grid
                                    item
                                    xs={6}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'row',
                                    }}
                                >
                                    <CustomButton
                                        fullWidth
                                        variant="contained"
                                        type="button"
                                        color="error"
                                        onClick={onClose}
                                        disabled={isSubmitting}
                                    >
                                        Cancelar
                                    </CustomButton>
                                </Grid>
                                <Grid
                                    item
                                    xs={6}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'row',
                                    }}
                                >
                                    <CustomButton
                                        fullWidth
                                        variant="contained"
                                        type="submit"
                                        color="success"
                                    >
                                        Recuperar
                                    </CustomButton>
                                </Grid>
                            </Grid>
                        </Form>
                    )
                }}
            </Formik>
        </CustomModal>
    );
};

export default ModalForgetPassword;