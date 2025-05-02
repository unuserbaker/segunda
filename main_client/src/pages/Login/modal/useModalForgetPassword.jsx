import * as Yup from 'Yup';
const useModalForgetPassword = () => {
    const initialValuesForgetForm = {
        usuario: '',
        numeroDocumento: '',
    };

    const validationSchema = Yup.object().shape({
        usuario: Yup.string().required('El nombre del usuario es obligatorio'),
        numeroDocumento: Yup.string()
            .required('El numero de documento es obligatorio')
            .matches(/^[0-9]+$/, 'El numero de documento debe ser un número'),
    });

    return {
        initialValuesForgetForm,
        validationSchema,
    };
};

export default useModalForgetPassword;
