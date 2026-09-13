import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getVehicle } from '@/core/services/vehicles_service/vehicles.js';

// Hook independiente para la ficha de detalle pública, siguiendo el mismo
// patrón de `Home/useVehiclesCatalog.js` (fetch propio, manejo de
// loading/error local, sin loaders de react-router).
const useVehicleDetail = () => {
  const { id } = useParams();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const loadVehicle = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      // GET /vehicles/:id responde { message, record }
      const { record } = await getVehicle(id);
      setVehicle(record ?? null);
    } catch (err) {
      if (err?.status === 404) {
        setNotFound(true);
      } else {
        setError(err?.message ?? 'Error cargando el vehículo');
      }
      setVehicle(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadVehicle();
  }, [loadVehicle]);

  return { vehicle, loading, error, notFound };
};

export default useVehicleDetail;
