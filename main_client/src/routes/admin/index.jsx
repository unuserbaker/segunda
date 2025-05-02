import DashBoard from "@/shared/Components/Dashboard/index.jsx";
import { MODULOS_ADMIN, ROUTE_IDS } from "@/utils/vars/index.jsx";
import RuleIcon from '@mui/icons-material/Rule';
import RedirectUtil from "@/utils/Redirect.jsx";
import { blue, indigo } from '@mui/material/colors';
import { json } from 'react-router-dom';
import VehiclesPage, { loader as LoaderVehicles } from "@P/Admin/Vehicles/index.jsx";
import MainLayout from "@/shared/Components/Layouts/main/index.jsx";

// Menú de administración
const menuItemsAdmin = [
  {
    name: 'Vehiculos',
    to: MODULOS_ADMIN.VEHICLES,
    icon: <RuleIcon />,
  },
];

// Loader principal para colores
const loader = async () => {
  const colors = {
    primary: 'primary',
    HxPrimary: blue[800],
    secondary: 'secondary',
    Hsecondary: indigo[500],
  };
  return json({ colors });
};

// Definición de rutas para la administración
const adminRoutes = [
  {
    id: ROUTE_IDS.ADMIN,
    loader: loader,
    path: 'admin',
    element: (
      <MainLayout
        TopTitle={'Administración'}
        topBackGround="primary"
        menuItems={menuItemsAdmin}
      />
    ),
    children: [
      {
        index: true,
        element: <RedirectUtil url={MODULOS_ADMIN.DASHBOARD} />,
      },
      {
        path: 'dashboard',
        element: <DashBoard tittle="Admin DashBoard" />,
      },
      {
        path: 'vehicles',
        loader: LoaderVehicles,
        element: <VehiclesPage />,
      },
    ],
  },
];

export default adminRoutes;