import { getRouteId } from '@/utils/functions';
import { useLocation, useRouteLoaderData } from 'react-router-dom';
import ReportGmailerrorredIcon from '@mui/icons-material/ReportGmailerrorred';
import CheckIcon from '@mui/icons-material/Check';
import { toast } from 'react-toastify';

const useMainApp = () => {
  const location = useLocation();
  const { colors } = useRouteLoaderData(getRouteId(location.pathname));
  /**
   * @param {string} message
   * @param {"success"|"error"|"warning"} type - Un número cualquiera.
   * @param {string} colorr ej: "#ffffff"
   */
  const handlePopUpToast = (message, type = 'success', colorr) => {
    switch (type) {
      case 'success':
        return toast.success(message, {
          progressStyle: {
            color: colorr ?? colors?.HxPrimary,
            background: colorr ?? colors?.HxPrimary,
          },
          style: { color: colorr ?? colors?.HxPrimary },
          icon: <CheckIcon sx={{ color: colorr ?? colors?.HxPrimary }} />,
        });
      case 'error':
        return toast.error(message, {
          progressStyle: {
            color: colorr ?? 'red',
            background: colorr ?? 'red',
          },
          style: { color: colorr ?? 'red' },
          icon: <ReportGmailerrorredIcon sx={{ color: colorr ?? 'red' }} />,
        });
      default:
        return toast[type](message);
    }
  };

  return {
    handlePopUpToast,
    colors,
    layout: getRouteId(location.pathname),
  };
};

export default useMainApp;
