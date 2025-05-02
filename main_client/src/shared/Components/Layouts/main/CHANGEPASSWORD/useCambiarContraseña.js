// import { change_password, logout } from '@/core/services/login';
import { useState } from 'react';
import * as Yup from 'Yup';
import useMainApp from '@/shared/Hooks/useMainApp';
import { useNavigate } from 'react-router-dom';
import { getInfoTokenUserLogged } from '@/utils/functions';
import { removeLocaleStorageItem } from '@/utils/functions/localeStorage';
import { LOCALSTORAGE_KEYS } from '@/utils/vars';

const useCambiarContraseña = () => {
  const initialValuesChangePassword = {
    old: '',
    new: '',
  };

  const validationSchemaChangePassword = Yup.lazy(() =>
    Yup.object().shape({
      old: Yup.string().required('Contraseña actual es requerida'),
      new: Yup.string().required('La nueva contraseña es requerida'),
      // newConfirm: Yup.string()
      //   .required('Confirmar contraseña es requerida')
      //   .oneOf([Yup.ref('new'), null], 'Las contraseñas no coinciden')
      //   .matches(/(?=.*[!@#$%^&*])/, 'Debe tener un caracter especial.')
      //   .matches(/(?=.*[0-9])/, 'Debe tener almenos un numero.')
      //   .matches(/(?=.*[A-Z])/, 'Debe tener almenos una Mayuscula.')
      //   .min(8, 'La contraseña debe tener minimo 8 Caracteres.')
      //   .notOneOf(
      //     [Yup.ref('old'), null],
      //     'La nueva contraseña no puede ser igual a la actual'
      //   ),
    })
  );

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleClickShowPasswordConfirm = () =>
    setShowPasswordConfirm((show) => !show);

  const { handlePopUpToast } = useMainApp();
  const navigate = useNavigate();

  const handleOnSubmit = async (values) => {
    const tkninfo = await getInfoTokenUserLogged();

    //   const decryptedData = await decryptValue(tokenResp);
    //   const decodedData = jwtDecode(decryptedData);

    const dataToSubmit = {
      oldContrasenna: values.old,
      newContrasenna: values.new,
    };
    try {
      const resChangePassw = await change_password(
        tkninfo['_sub'],
        dataToSubmit
      );
      await logout(null);
      handlePopUpToast(`${resChangePassw.message}`);
      removeLocaleStorageItem(LOCALSTORAGE_KEYS.token);
    } catch (error) {
      handlePopUpToast(`Error: ${error.message}`, 'error');
    } finally {
      navigate('/');
    }
  };

  return {
    handleOnSubmit,
    showPassword,
    showPasswordConfirm,
    handleClickShowPassword,
    handleClickShowPasswordConfirm,
    initialValuesChangePassword,
    validationSchemaChangePassword,
  };
};

export default useCambiarContraseña;
