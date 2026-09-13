import { Alert } from '@mui/material';
import LoadingComponent from '@/components/Loading';
import useSellerVerification from '@/shared/Hooks/useSellerVerification.js';

const DashBoard = ({ tittle = 'dashboard' }) => {
  const { loading, isSellerUnverified } = useSellerVerification();

  return (
    <div>
      {loading && <LoadingComponent />}
      {!loading && isSellerUnverified && (
        <Alert severity="warning" sx={{ marginBottom: 2 }}>
          Cuenta en revisión — un asesor verificará tu concesionaria antes de
          que puedas publicar vehículos.
        </Alert>
      )}
      <h4>{tittle}</h4>
    </div>
  );
};

export default DashBoard;
