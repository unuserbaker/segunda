import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import {
  AppBar as MuiAppBar,
  Box,
  Toolbar,
  Typography,
  IconButton,
  CssBaseline,
  Button,
  Divider,
  MenuItem,
  Menu,
  ListItem,
  List,
  ListItemAvatar,
  Avatar,
  ListItemText,
} from '@mui/material';

import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import LoginIcon from '@mui/icons-material/Login';
import FacebookIcon from '@mui/icons-material/Facebook';
import XIcon from '@mui/icons-material/X';
import PinterestIcon from '@mui/icons-material/Pinterest';
import YouTubeIcon from '@mui/icons-material/YouTube';
import MailIcon from '@mui/icons-material/Mail';

import RuleIcon from '@mui/icons-material/Rule';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ReportIcon from '@mui/icons-material/Report';
import { Link } from 'react-router-dom';

const drawerWidth = 240;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const menuItems = [
  {
    id: 1,
    name: 'Inicio',
    to: '/',
    icon: <RuleIcon />,
    color: 'black',
  },
  {
    id: 2,
    name: 'Páginas',
    to: '/budget',
    icon: <AssignmentIcon />,
    color: 'black',
    children: [
      {
        name: 'Acerca de nosotros',
        to: '/about',
        icon: <RuleIcon />,
      },
      {
        name: 'Comparar precios',
        to: '/compare',
        icon: <RuleIcon />,
        children: [
          {
            id: 1,
            name: 'Comparar Vehiculos',
            to: 'compare-cars',
            icon: <RuleIcon />,
          },
          {
            id: 2,
            name: 'Comparar Detalles',
            to: 'compare-cars',
            icon: <RuleIcon />,
          },
        ],
      },
      {
        name: 'Calculadora Financiera',
        to: '/calculator',
        icon: <RuleIcon />,
      },
      {
        name: "FAQ's",
        to: '/faqs',
        icon: <RuleIcon />,
      },
      {
        name: 'Testimonios',
        to: '/testimonials',
        icon: <RuleIcon />,
      },
    ],
  },
  {
    id: 3,
    name: 'Servicios',
    to: '/services',
    icon: <ReportIcon />,
    color: 'black',
    children: [
      {
        name: 'Estilo de servicio 1',
        to: '/services-style-01',
        icon: <RuleIcon />,
      },
      {
        name: 'Estilo de servicio 2',
        to: '/services-style-02',
        icon: <RuleIcon />,
      },
      {
        name: 'Detalle de servicios',
        to: '/services-details',
        icon: <RuleIcon />,
      },
    ],
  },
  {
    id: 4,
    name: 'Tienda',
    to: '/services',
    icon: <ReportIcon />,
    color: 'black',
    children: [
      {
        name: 'Nuestra tienda',
        to: '/our-shop',
        icon: <RuleIcon />,
      },
      {
        name: 'Tienda de carros',
        to: '/car-shop',
        icon: <RuleIcon />,
      },
      {
        name: 'Lista de tiendas',
        to: '/shop-list',
        icon: <RuleIcon />,
      },
      {
        name: 'Detalles de producto 1',
        to: '/product-details-01',
        icon: <RuleIcon />,
      },
      {
        name: 'Detalles de producto 2',
        to: '/product-details-02',
        icon: <RuleIcon />,
      },
    ],
  },
  {
    id: 6,
    name: 'Noticias',
    to: '/news',
    icon: <ReportIcon />,
    color: 'black',
    children: [
      {
        name: 'Lista de noticias',
        to: '/news-list',
        icon: <RuleIcon />,
      },
      {
        name: 'Rejilla de noticias',
        to: '/news-grid',
        icon: <RuleIcon />,
      },
      {
        name: 'Detalle de noticias',
        to: '/news-details',
        icon: <RuleIcon />,
      },
    ],
  },
  {
    id: 5,
    name: 'Contacto',
    to: '/contact',
    icon: <ReportIcon />,
    color: 'red',
  },
];

const LandingLayout = ({ TopTitle = 'Segunda' }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const navigate = useNavigate();

  const handleMenuOpen = (event, itemId) => {
    setAnchorEl(event.currentTarget);
    setOpenMenu(itemId);
  };

  const handleMenuClose = () => {
    setOpenMenu(null);
    setAnchorEl(null);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{ backgroundColor: 'white', color: 'black' }}
      >
        <Toolbar
          sx={{ justifyContent: 'center', bgcolor: 'red', color: 'white' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AccessTimeIcon fontSize="small" />
            <Typography variant="caption">
              Lunes-Sabado 7:00AM - 6:00PM
            </Typography>
            <LocationOnIcon fontSize="small" />
            <Typography variant="caption">
              Kr 20 #88-20, Bogotá, Colombia
            </Typography>
            <Box
              sx={{
                ml: '160px',
                display: 'flex',
                bgcolor: 'white',
                height: '70px',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Button variant="text">
                <PhoneIcon fontSize="small" sx={{ color: 'red' }} />
                <Typography variant="caption" sx={{ color: 'red' }}>
                  +57
                </Typography>
                <Typography variant="caption" sx={{ color: 'black' }}>
                  3016805793
                </Typography>
              </Button>
            </Box>
          </Box>
        </Toolbar>

        <Toolbar sx={{ justifyContent: 'center', mt: '1px' }}>
          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              alignItems: 'center',
              ml: 5,
              cursor: 'pointer',
            }}
            onClick={() => navigate('/')}
          >
            <img
              src="/img/for-bike.png"
              alt="Segunda Logo"
              style={{ marginRight: '10px' }}
            />
            <Typography variant="h6">{TopTitle}</Typography>
          </Box>
          <Box>
            {menuItems.map((item) => (
              <Box
                key={item.id}
                sx={{ display: 'inline-block', margin: '0 10px' }}
              >
                <Button
                  onClick={() => navigate(item.to)}
                  onMouseMove={(e) =>
                    item.children && handleMenuOpen(e, item.id)
                  }
                >
                  <Typography
                    variant="body2"
                    sx={{ color: item.color, fontWeight: 'bold' }}
                  >
                    {item.name}
                  </Typography>
                </Button>
                {item.children && (
                  <Menu
                    sx={{ mt: '20px' }}
                    anchorEl={anchorEl}
                    open={openMenu === item.id}
                    onClose={handleMenuClose}
                    MenuListProps={{ onMouseLeave: handleMenuClose }}
                  >
                    {item.children.map((child) => (
                      <MenuItem
                        key={child.name}
                        onClick={() => {
                          navigate(child.to);
                          handleMenuClose();
                        }}
                      >
                        {child.name}
                      </MenuItem>
                    ))}
                  </Menu>
                )}
              </Box>
            ))}
          </Box>
          <Box sx={{ ml: 3, display: 'flex', alignItems: 'center' }}>
            <IconButton>
              <ShoppingBagIcon />
            </IconButton>
            <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
            <IconButton>
              <SearchOutlinedIcon />
            </IconButton>
            <IconButton onClick={() => navigate('/login')}>
              <LoginIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 20 }}>
        <Outlet />
      </Box>

      <Box
        component="footer"
        sx={{
          bgcolor: 'black',
          color: 'white',
          p: 3,
          textAlign: 'center',
        }}
      >
        <Toolbar sx={{ justifyContent: 'center', flexWrap: 'wrap' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              mr: 4,
            }}
            onClick={() => navigate('/')}
          >
            <img
              src="/img/for-bike.png"
              alt="Segunda Logo"
              style={{ height: 40, marginRight: '10px' }}
            />
            <Typography variant="h6">{TopTitle}</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton sx={{ color: 'white' }}>
              <FacebookIcon />
            </IconButton>
            <IconButton sx={{ color: 'white' }}>
              <XIcon />
            </IconButton>
            <IconButton sx={{ color: 'white' }}>
              <PinterestIcon />
            </IconButton>
            <IconButton sx={{ color: 'white' }}>
              <YouTubeIcon />
            </IconButton>
          </Box>
        </Toolbar>

        <Typography variant="h6">Información de contacto:</Typography>
        <Divider sx={{ my: 1, bgcolor: 'grey.700' }} />

        <Typography variant="body2" sx={{ mt: 2 }}>
          Proporcionamos todo lo que necesita para su vehículo, desde la compra
          hasta el mantenimiento. Contáctenos para más información.
        </Typography>
        <Box
          sx={{
            mt: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOnIcon fontSize="small" />
            <Typography variant="caption">
              Kr 20 #88-20, Bogotá, Colombia
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhoneIcon fontSize="small" />
            <Typography variant="caption">+57 3016805793</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MailIcon fontSize="small" />
            <Typography variant="caption">soporte@segunda.com.co</Typography>
          </Box>
        </Box>

        <Typography variant="h6">Enlaces de interés:</Typography>
        <Divider sx={{ my: 1, bgcolor: 'grey.700' }} />

        <Box
          sx={{
            mt: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Link href="#" underline="none" color="grey.700">
            Cambiar el aceite y el filtro
          </Link>

          <Link href="#" underline="none" color="grey.700">
            Reemplazo de pastillas de freno
          </Link>

          <Link href="#" underline="none" color="grey.700">
            Reemplazo de la correa de distribución
          </Link>

          <Link href="#" underline="none" color="grey.700">
            Inspección de automóviles antes de la compra
          </Link>

          <Link href="#" underline="none" color="grey.700">
            Reemplazar el motor de arranque
          </Link>

          <Link href="#" underline="none" color="grey">
            Climatización
          </Link>
        </Box>

        <Typography variant="h6">Públicaciones Recientes</Typography>
        <Divider sx={{ my: 1, bgcolor: 'grey.700' }} />

        <Box
          sx={{
            mt: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <List
            sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}
          >
            <ListItem alignItems="flex-start">
              <ListItemAvatar>
                <Avatar alt="Travis Howard" src="/static/images/avatar/2.jpg" />
              </ListItemAvatar>
              <ListItemText
                primary="Summer BBQ"
                secondary={
                  <>
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{ color: 'text.primary', display: 'inline' }}
                    >
                      to Scott, Alex, Jennifer
                    </Typography>
                    {" — Wish I could come, but I'm out of town this…"}
                  </>
                }
              />
            </ListItem>
            <ListItem alignItems="flex-start">
              <ListItemAvatar>
                <Avatar alt="Travis Howard" src="/static/images/avatar/2.jpg" />
              </ListItemAvatar>
              <ListItemText
                primary="Summer BBQ"
                secondary={
                  <>
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{ color: 'text.primary', display: 'inline' }}
                    >
                      to Scott, Alex, Jennifer
                    </Typography>
                    {" — Wish I could come, but I'm out of town this…"}
                  </>
                }
              />
            </ListItem>
            <ListItem alignItems="flex-start">
              <ListItemAvatar>
                <Avatar alt="Travis Howard" src="/static/images/avatar/2.jpg" />
              </ListItemAvatar>
              <ListItemText
                primary="Summer BBQ"
                secondary={
                  <>
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{ color: 'text.primary', display: 'inline' }}
                    >
                      to Scott, Alex, Jennifer
                    </Typography>
                    {" — Wish I could come, but I'm out of town this…"}
                  </>
                }
              />
            </ListItem>
          </List>
        </Box>

        <Typography variant="h6">Descarga la aplicación</Typography>
        <Divider sx={{ my: 1, bgcolor: 'grey.700' }} />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Descarga nuestra aplicación de carros.
        </Typography>

        <Box>
          <Link target="blank" rel="noopener" href="#">
            <img src="" alt="App Store" />
          </Link>

          <Link target="blank" rel="noopener" href="#">
            <img src="" alt="Google Play" />
          </Link>
        </Box>

        <Typography variant="body2" sx={{ mt: 2 }}>
          © 2025 Segunda. Todos los derechos reservados.
        </Typography>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 3,
            mt: 2,
            flexWrap: 'wrap',
          }}
        >
          <Typography
            variant="caption"
            onClick={() => navigate('/privacy-policy')}
            sx={{ cursor: 'pointer', textDecoration: 'underline' }}
          >
            Política de privacidad
          </Typography>
          <Typography
            variant="caption"
            onClick={() => navigate('/terms-of-service')}
            sx={{ cursor: 'pointer', textDecoration: 'underline' }}
          >
            Términos de servicio
          </Typography>
          <Typography
            variant="caption"
            onClick={() => navigate('/cookie-policy')}
            sx={{ cursor: 'pointer', textDecoration: 'underline' }}
          >
            Política de cookies
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default LandingLayout;
