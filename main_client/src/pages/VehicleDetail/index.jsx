import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  ImageList,
  ImageListItem,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import VehicleStatusBadge from '@/shared/Components/Others/VehicleStatusBadge.jsx';
import useVehicleDetail from './useVehicleDetail.js';

// Mismo placeholder que usa el catálogo público (`Home/index.jsx`) cuando
// el vehículo no tiene fotos reales todavía (context `files/` en progreso).
const PLACEHOLDER_IMAGE = '/img/bmw-gris.jpeg';

const formatPrice = (price) => {
  const value = Number(price);
  if (Number.isNaN(value)) return price;
  return value.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
};

const VehicleDetailPage = () => {
  const { vehicle, loading, error, notFound } = useVehicleDetail();

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (notFound) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Alert severity="warning">
          No encontramos el vehículo solicitado. Puede que ya no esté disponible.
        </Alert>
        <Button component={RouterLink} to="/home" sx={{ mt: 2 }}>
          Volver al catálogo
        </Button>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!vehicle) return null;

  const photos = Array.isArray(vehicle.photos) && vehicle.photos.length > 0 ? vehicle.photos : null;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Button component={RouterLink} to="/home" sx={{ mb: 2 }}>
        &larr; Volver al catálogo
      </Button>

      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          {photos ? (
            <ImageList cols={photos.length > 1 ? 2 : 1} gap={8}>
              {photos
                .slice()
                .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                .map((photo) => (
                  <ImageListItem key={photo.id}>
                    <img src={photo.url} alt="Foto del vehículo" loading="lazy" style={{ borderRadius: 8 }} />
                  </ImageListItem>
                ))}
            </ImageList>
          ) : (
            <Box
              component="img"
              src={PLACEHOLDER_IMAGE}
              alt={`${vehicle.brand?.name ?? ''} ${vehicle.category?.name ?? ''}`}
              sx={{ width: '100%', height: 360, objectFit: 'cover', borderRadius: 3 }}
            />
          )}
        </Grid>

        <Grid item xs={12} md={5}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {vehicle.brand?.name ?? 'Marca'} {vehicle.category?.name ?? ''}
            </Typography>
            <VehicleStatusBadge status={vehicle.status} />
          </Stack>

          <Typography variant="h5" color="primary" sx={{ fontWeight: 700, mb: 2 }}>
            {formatPrice(vehicle.price)}
          </Typography>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 3 }}>
            {vehicle.year && <Chip label={vehicle.year} size="small" />}
            {vehicle.mileage != null && (
              <Chip label={`${Number(vehicle.mileage).toLocaleString('es-CO')} km`} size="small" />
            )}
            {vehicle.type?.name && <Chip label={vehicle.type.name} size="small" />}
            {vehicle.transmission?.name && <Chip label={vehicle.transmission.name} size="small" />}
            {vehicle.engineType?.name && <Chip label={vehicle.engineType.name} size="small" />}
            {vehicle.color && <Chip label={vehicle.color} size="small" />}
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <Stack spacing={1} sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Placa: {vehicle.plate ?? 'No disponible'}
            </Typography>
            {vehicle.description && (
              <Typography variant="body1" sx={{ mt: 1 }}>
                {vehicle.description}
              </Typography>
            )}
          </Stack>

          {/*
            Gap de backend: `GET /vehicles/:id` no expone datos de seller/ubicación
            (revisar `vehicle.service.ts#findOne` — solo trae relations brand/category/
            engineType/transmission/type/status). Se deja como "próximamente" en vez
            de inventar el dato; reportar a @architect/@developer de `vehicles` o
            `sellers` si se necesita para el MVP.
          */}
          <Alert severity="info" sx={{ mb: 3 }}>
            Ubicación del vendedor: próximamente.
          </Alert>

          <Tooltip title="Próximamente">
            <span>
              <Button variant="contained" size="large" fullWidth disabled>
                Agendar visita
              </Button>
            </span>
          </Tooltip>
        </Grid>
      </Grid>
    </Container>
  );
};

export default VehicleDetailPage;
