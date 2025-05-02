// import { logout } from '@/core/services/login';
// import { useUserContext } from '@/shared/Contexts/UserContext/userContex';
import useMainApp from '@/shared/Hooks/useMainApp';
import { getRouteId } from '@/utils/functions';
import { MODULOS_ADMIN, ROUTE_IDS, fifteenMinsMiliSec } from '@/utils/vars';
import { useEffect } from 'react';
import { useRouteLoaderData, useNavigate, useLocation } from 'react-router-dom';

const useMainLayout = () => {
  // const {
  //   notificacionesList,
  //   handleListNotificacions,
  //   handleLeerNotificacion,
  // } = useUserContext();
  // const { usuario, tokenInfoLogged } = useRouteLoaderData(ROUTE_IDS.USER);
  const usuario = {
    changePassword: false,
    name: 'Juan',
    lastName: 'Mendivelso',
  }
  const location = useLocation();
  const layoutPage = getRouteId(location.pathname);
  const { handlePopUpToast } = useMainApp();
  const navigate = useNavigate();

  const handleMainLogout = async () => {
    try {
      const { message } = await logout(null);
      message && handlePopUpToast(message);
      localStorage.clear();
    } catch (error) {
      handlePopUpToast(error?.message, 'error');
    } finally {
      navigate('/');
    }
  };

  const handleRedirectsNotification = (notificacion) => {
    const { novedadesPorAprobar } = notificacion;
    try {
      switch (layoutPage) {
        case ROUTE_IDS.ADMIN:
          return location.pathname !== MODULOS_ADMIN.APROBACION &&
            novedadesPorAprobar?.length
            ? navigate(MODULOS_ADMIN.APROBACION)
            : null;
        default:
          break;
      }
    } catch (error) {
      handlePopUpToast('error', 'warning');
    }
  };

  // useEffect(() => {
  //   const initialDelay = 100;
  //   const initialTimer = setTimeout(() => {
  //     handleListNotificacions(layoutPage);
  //   }, initialDelay);

  //   let intervalId = null;
  //   if (layoutPage === ROUTE_IDS.ADMIN)
  //     /** NOTA: Si layoutPage es "admin", se ejecutara cada 10 minutos*/
  //     intervalId = setInterval(() => {
  //       handleListNotificacions(ROUTE_IDS.ADMIN);
  //     }, fifteenMinsMiliSec);

  //   return () => {
  //     clearTimeout(initialTimer);
  //     if (intervalId) clearInterval(intervalId);
  //   };
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [layoutPage]);

  return {
    usuario,
    layoutPage,
    // notificacionesUsuario: notificacionesList,
    // notifLeidas: notificacionesList
    //   ?.map((not) => not?.leido)
    //   ?.every((leido) => !!leido),
    handleMainLogout,
    // handleLeerNotificacion,
    handleRedirectsNotification,
  };
};
export default useMainLayout;
