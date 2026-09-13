import { Chip } from '@mui/material';

// Extraído de `Home/index.jsx` para reutilizar el mismo criterio de badge
// de estado en la ficha de detalle (`VehicleDetail`). Mínimo diff: mismo
// texto/color/condición que ya usaba el catálogo.
const VehicleStatusBadge = ({ status, ...chipProps }) => {
  if (status?.str_code !== 'active_appointment') return null;

  return <Chip label="Próxima visita agendada" color="warning" size="small" {...chipProps} />;
};

export default VehicleStatusBadge;
