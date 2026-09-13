import { useEffect, useState } from 'react';
import { getInfoTokenUserLogged } from '@/utils/functions';
import { getMySeller } from '@/core/services/sellers_service/sellers.js';

/**
 * Resuelve el estado de verificación del seller autenticado.
 * - Si el usuario logueado no es `seller`, no hace fetch (isSellerUnverified = false).
 * - Si el fetch da 404 (usuario sin perfil de seller), se trata como flujo normal (isSellerUnverified = false).
 * - Mientras `loading` es true, el estado de verificación no debe usarse para tomar decisiones visuales
 *   (evita parpadeo del banner / CTA deshabilitado).
 */
const useSellerVerification = () => {
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchSeller = async () => {
      const userInfo = await getInfoTokenUserLogged();
      if (userInfo?.role !== 'seller') {
        if (mounted) setLoading(false);
        return;
      }
      try {
        const { record } = await getMySeller();
        if (mounted) setSeller(record);
      } catch (error) {
        // 404: usuario seller sin perfil, u otro caso sin perfil -> flujo normal, sin banner/bloqueo
        if (mounted) setSeller(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchSeller();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    loading,
    seller,
    isSellerUnverified: !loading && seller?.verified === false,
  };
};

export default useSellerVerification;
