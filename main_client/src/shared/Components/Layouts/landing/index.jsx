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
} from '@mui/material';

import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import LoginIcon from '@mui/icons-material/Login';

import RuleIcon from '@mui/icons-material/Rule';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ReportIcon from '@mui/icons-material/Report';


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
                name: "Acerca de nosotros",
                to: '/about',
                icon: <RuleIcon />,
            },
            {
                name: "Comparar precios",
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
                    }
                ]
            },
            {
                name: "Calculadora Financiera",
                to: '/calculator',
                icon: <RuleIcon />,
            },
            {
                name: "FAQ's",
                to: '/faqs',
                icon: <RuleIcon />,
            },
            {
                name: "Testimonios",
                to: '/testimonials',
                icon: <RuleIcon />,
            },
        ]
    },
    {
        id: 3,
        name: 'Servicios',
        to: '/services',
        icon: <ReportIcon />,
        color: 'black',
        children: [
            {
                name: "Estilo de servicio 1",
                to: '/services-style-01',
                icon: <RuleIcon />,
            },
            {
                name: "Estilo de servicio 2",
                to: '/services-style-02',
                icon: <RuleIcon />,
            },
            {
                name: "Detalle de servicios",
                to: '/services-details',
                icon: <RuleIcon />,
            },
        ]
    },
    {
        id: 4,
        name: 'Tienda',
        to: '/services',
        icon: <ReportIcon />,
        color: 'black',
        children: [
            {
                name: "Nuestra tienda",
                to: '/our-shop',
                icon: <RuleIcon />,
            },
            {
                name: "Tienda de carros",
                to: '/car-shop',
                icon: <RuleIcon />,
            },
            {
                name: "Lista de tiendas",
                to: '/shop-list',
                icon: <RuleIcon />,
            },
            {
                name: "Detalles de producto 1",
                to: '/product-details-01',
                icon: <RuleIcon />,
            },
            {
                name: "Detalles de producto 2",
                to: '/product-details-02',
                icon: <RuleIcon />,
            },
        ]
    },
    {
        id: 6,
        name: 'Noticias',
        to: '/news',
        icon: <ReportIcon />,
        color: 'black',
        children: [
            {
                name: "Lista de noticias",
                to: '/news-list',
                icon: <RuleIcon />,
            },
            {
                name: "Rejilla de noticias",
                to: '/news-grid',
                icon: <RuleIcon />,
            },
            {
                name: "Detalle de noticias",
                to: '/news-details',
                icon: <RuleIcon />,
            },
        ]
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
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar position="fixed" sx={{ backgroundColor: 'white', color: 'black' }}>
                <Toolbar sx={{ justifyContent: 'center', bgcolor: 'red', color: 'white' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <AccessTimeIcon fontSize='small' />
                        <Typography variant="caption">
                            Lunes-Sabado 7:00AM - 6:00PM
                        </Typography>
                        <LocationOnIcon fontSize='small' />
                        <Typography variant="caption">
                            Kr 20 #88-20, Bogotá, Colombia
                        </Typography>
                        <Box sx={{ ml: '160px', display: 'flex', bgcolor: 'white', height: '70px', alignItems: 'center', gap: 2 }}>
                            <Button variant='text'>
                                <PhoneIcon fontSize='small' sx={{ color: 'red' }} />
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
                    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', ml: 5, cursor: 'pointer' }}
                        onClick={() => navigate('/')}>
                        <img src="/img/for-bike.png" alt="Segunda Logo" style={{ marginRight: '10px' }} />
                        <Typography
                            variant="h6"
                        >
                            {TopTitle}
                        </Typography>
                    </Box>
                    <Box>
                        {menuItems.map((item) => (
                            <Box key={item.id} sx={{ display: 'inline-block', margin: '0 10px' }}>
                                <Button
                                    onClick={() => navigate(item.to)}
                                    onMouseMove={(e) => item.children && handleMenuOpen(e, item.id)}
                                >
                                    <Typography variant='body2' sx={{ color: item.color, fontWeight: 'bold' }}>
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
                        <IconButton
                            onClick={() => navigate('/login')}
                        >
                            <LoginIcon />
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>

            <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 20 }}>
                <Outlet />
            </Box>
        </Box>
    );
};

export default LandingLayout;
