import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useTransition } from '@react-spring/web';
import * as Yup from 'Yup';
import useMainApp from '@/shared/Hooks/useMainApp';
import { login } from '@/core/services/iam_service/auth.js';
import { setLocaleStorageItems } from '@/utils/functions/localeStorage';
import { LOCALSTORAGE_KEYS } from '@/utils/vars';

const useLogin = () => {

    const [showModalPass, setshowModalPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [index, set] = useState(0);

    const { handlePopUpToast } = useMainApp();
    const navigate = useNavigate();
    const initialValuesLoginForm = {
        email: '',
        password: '',
    };

    const validationSchemaLoginForm = Yup.lazy((values) =>
        Yup.object().shape({
            email: Yup.string().required('Usuario es requerido'),
            password: Yup.string().required('La contraseña es requerida'),
        })
    );

    const showModalPassword = () => {
        setshowModalPassword(true);
    };

    const closeModalPassword = () => {
        setshowModalPassword(false);
    };

    const handleClickShowPassword = () => setShowPassword((show) => !show);

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    const forgetPassword = () => {
        console.log('Olvido su contraseña?');
    };

    const handleSubmit = async (values) => {
        try {
            const dataSend = {
                email: values.email,
                password: values.password,
            };
            const { record, message } = await login(dataSend);
            const { token, user } = record;
            setLocaleStorageItems({ key: LOCALSTORAGE_KEYS.token, value: token });
            setLocaleStorageItems({ key: LOCALSTORAGE_KEYS.usuario, value: JSON.stringify(user) });
            const decodedData = jwtDecode(token);
            const role = decodedData.role;
            handlePopUpToast(message ?? 'Sesión iniciada', 'success');
            if (role === 'seller') {
                navigate('/admin/dashboard');
            } else {
                navigate('/');
            }
        } catch (error) {
            handlePopUpToast(`${error?.message}`, 'error');
        }
    };

    const transitions = useTransition(index, {
        key: index,
        from: { opacity: 0 },
        enter: { opacity: 1 },
        leave: { opacity: 0 },
        config: { duration: 1000 },
        exitBeforeEnter: true,
    });

    return {
        initialValuesLoginForm,
        showPassword,
        handleClickShowPassword,
        handleMouseDownPassword,
        handleSubmit,
        forgetPassword,
        transitions,
        set,
        showModalPassword,
        showModalPass,
        closeModalPassword,
        validationSchemaLoginForm,
    };
}
export default useLogin;