import { useMemo } from 'react';
import CustomAccordion from '../../Accordion';

const transformToString = (novedadesAprobar) =>
  novedadesAprobar
    ?.map((item, index) => {
      const parsedItem = JSON.parse(item);
      return `ID: ${parsedItem?.idReporteNovedad} (${parsedItem?.fechaReporte.split('T')[0]})${index === novedadesAprobar?.length - 1 ? '.' : ','}`;
    })
    .join('\n');

const ListNotifications = ({
  notificacion,
  handleLeerNotificacion,
  handleRedirectsNotification,
  bgColor,
}) => {
  const { idReporteNotificacion, motivo, mensaje, leido, novedadesPorAprobar } =
    notificacion;

  const detallesNovedades = useMemo(
    () =>
      novedadesPorAprobar?.length ? transformToString(novedadesPorAprobar) : '',
    [novedadesPorAprobar]
  );

  return (
    <CustomAccordion
      title={`${motivo?.nombre || ''}`}
      content={`${mensaje}`}
      detailsContent={detallesNovedades}
      bgColor={`${bgColor}${leido ? '59' : 'BF'}`}
      handleOpen={() => !leido && handleLeerNotificacion(idReporteNotificacion)}
      handleOnContentClick={() => handleRedirectsNotification(notificacion)}
    />
  );
};

export default ListNotifications;
