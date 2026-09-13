import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'Yup';
import useMainApp from '@/shared/Hooks/useMainApp';
import { register } from '@/core/services/iam_service/auth.js';

const useRegister = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [registeredSuccessfully, setRegisteredSuccessfully] = useState(false);

    const { handlePopUpToast } = useMainApp();
    const navigate = useNavigate();

    const initialValuesRegisterForm = {
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'buyer',
        businessName: '',
        taxId: '',
        phone: '',
    };

    const validationSchemaRegisterForm = Yup.object().shape({
        name: Yup.string().required('El nombre es requerido'),
        email: Yup.string()
            .email('El correo no es válido')
            .required('El correo es requerido'),
        password: Yup.string()
            .min(6, 'La contraseña debe tener al menos 6 caracteres')
            .required('La contraseña es requerida'),
        confirmPassword: Yup.string()
            .oneOf([Yup.ref('password'), null], 'Las contraseñas no coinciden')
            .required('La confirmación de contraseña es requerida'),
        role: Yup.string().oneOf(['buyer', 'seller']).required('El rol es requerido'),
        businessName: Yup.string().when('role', {
            is: 'seller',
            then: (schema) => schema.required('La razón social es requerida'),
            otherwise: (schema) => schema.notRequired(),
        }),
        taxId: Yup.string().when('role', {
            is: 'seller',
            then: (schema) => schema.required('El NIT/RUT es requerido'),
            otherwise: (schema) => schema.notRequired(),
        }),
        phone: Yup.string().when('role', {
            is: 'seller',
            then: (schema) => schema.required('El teléfono es requerido'),
            otherwise: (schema) => schema.notRequired(),
        }),
    });

    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const handleClickShowConfirmPassword = () =>
        setShowConfirmPassword((show) => !show);

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    const handleSubmit = async (values) => {
        try {
            const dataSend = {
                name: values.name,
                email: values.email,
                password: values.password,
                role: values.role,
                ...(values.role === 'seller'
                    ? {
                          business_name: values.businessName,
                          tax_id: values.taxId,
                          phone: values.phone,
                      }
                    : {}),
            };
            const { message } = await register(dataSend);
            setRegisteredSuccessfully(true);
            handlePopUpToast(
                message ?? 'Registro exitoso, ya puedes iniciar sesión',
                'success'
            );
        } catch (error) {
            handlePopUpToast(`${error?.message}`, 'error');
        }
    };

    const goToLogin = () => navigate('/login');

    return {
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
    };
};

export default useRegister;
