import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
} from '@mui/material';

const featuredVehicles = [
  {
    id: 1,
    name: 'BMW Serie 5',
    image: '/img/bmw-dark-blue.jpeg',
    year: '2008',
    mileage: '128.000 km',
    fuel: 'Gasolina',
  },
  {
    id: 2,
    name: 'BMW Serie 3',
    image: '/img/bmw-dark-gray.jpeg',
    year: '2010',
    mileage: '116.000 km',
    fuel: 'Gasolina',
  },
  {
    id: 3,
    name: 'BMW Serie 3',
    image: '/img/bmw-gris.jpeg',
    year: '2013',
    mileage: '98.000 km',
    fuel: 'Gasolina',
  },
];

const HomePage = () => {
  return (
    <Box component="main" sx={{ bgcolor: 'background.default', pb: 6 }}>
      <Container maxWidth="xl" sx={{ pt: { xs: 3, md: 5 } }}>
        <Box
          sx={{
            position: 'relative',
            borderRadius: 3,
            overflow: 'hidden',
            minHeight: { xs: 260, md: 360 },
            display: 'flex',
            alignItems: 'flex-end',
            p: { xs: 3, md: 5 },
            color: 'common.white',
            backgroundImage:
              'linear-gradient(to top, rgba(0,0,0,.65), rgba(0,0,0,.05)), url(/img/bmw-dark-blue.jpeg)',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
        >
          <Box sx={{ maxWidth: 620 }}>
            <Typography variant="overline" sx={{ letterSpacing: 1.5 }}>
              Catálogo de Vehículos
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.8rem', md: '2.6rem' },
                lineHeight: 1.15,
                mb: 1.5,
              }}
            >
              Encuentra tu próximo vehículo en excelente estado
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.95, mb: 2.5 }}>
              Explora opciones destacadas con historial confiable y atención
              personalizada para todo el proceso de compra.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button variant="contained" color="primary">
                Ver inventario
              </Button>
              <Button variant="outlined" color="inherit">
                Agendar asesoría
              </Button>
            </Stack>
          </Box>
        </Box>

        <Box sx={{ mt: { xs: 3, md: 5 } }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Vehículos destacados
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Selección recomendada por condición, kilometraje y desempeño.
          </Typography>

          <Grid container spacing={3}>
            {featuredVehicles.map((vehicle) => (
              <Grid item xs={12} md={6} lg={4} key={vehicle.id}>
                <Card sx={{ height: '100%', borderRadius: 3 }}>
                  <CardMedia
                    component="img"
                    image={vehicle.image}
                    alt={vehicle.name}
                    sx={{ height: 240 }}
                  />
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                      {vehicle.name}
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      useFlexGap
                      flexWrap="wrap"
                      sx={{ mb: 2 }}
                    >
                      <Chip label={vehicle.year} size="small" />
                      <Chip label={vehicle.mileage} size="small" />
                      <Chip label={vehicle.fuel} size="small" />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Revisión mecánica al día, documentación lista para
                      traspaso y entrega inmediata.
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Button variant="contained" size="small">
                      Ver detalle
                    </Button>
                    <Button size="small">Comparar</Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default HomePage;
