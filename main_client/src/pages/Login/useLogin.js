import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useTransition } from '@react-spring/web';
import * as Yup from 'Yup';
import useMainApp from '@/shared/Hooks/useMainApp';
import { decryptValue, eliminarDuplicadosPorClaves } from '@/utils/functions';

// import useMainApp from '@/shared/Hooks/useMainApp';

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
        // console.log('soy el servicio de login');
        // let lay,
        //     message = null;
        // try {
        //     const dataSend = {
        //         ...values,
        //     };
        //     const { record, message: respMessage } = await login(dataSend);
        //     const tkn = record.tkn;
        //     await localStorage.setItem('tkn', tkn);
        //     const decryptedData = await decryptValue(tkn);
        //     const decodedData = jwtDecode(decryptedData);
        //     lay = decodedData.lay;
        //     message = respMessage;
        // } catch (error) {
        //     handlePopUpToast(`${error?.message}`, 'error');
        // } finally {
        //     !!lay && navigate(`/${lay}/dashboard`);
        navigate(`/admin/dashboard`);
        //     !!message &&
        setTimeout(
            () =>
                handlePopUpToast(
                    'message',
                    'success',
                ),
            500
        );
        // }
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