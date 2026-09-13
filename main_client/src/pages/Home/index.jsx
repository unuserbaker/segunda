import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Container,
  Grid,
  MenuItem,
  Pagination,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

import VehicleStatusBadge from '@/shared/Components/Others/VehicleStatusBadge.jsx';
import useVehiclesCatalog from './useVehiclesCatalog.js';

const PLACEHOLDER_IMAGE = '/img/bmw-gris.jpeg';

const formatPrice = (price) => {
  const value = Number(price);
  if (Number.isNaN(value)) return price;
  return value.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
};

const HomePage = () => {
  const navigate = useNavigate();
  const {
    vehicles,
    brands,
    categories,
    types,
    filters,
    handleFilterChange,
    handleResetFilters,
    page,
    setPage,
    pagination,
    loading,
    error,
  } = useVehiclesCatalog();

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

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Marca"
                size="small"
                value={filters.brandId}
                onChange={(e) => handleFilterChange('brandId', e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {brands.map((brand) => (
                  <MenuItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Categoría"
                size="small"
                value={filters.categoryId}
                onChange={(e) => handleFilterChange('categoryId', e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                select
                fullWidth
                label="Tipo"
                size="small"
                value={filters.typeId}
                onChange={(e) => handleFilterChange('typeId', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {types.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <TextField
                fullWidth
                type="number"
                label="Precio mín."
                size="small"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              />
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <TextField
                fullWidth
                type="number"
                label="Precio máx."
                size="small"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              />
            </Grid>
          </Grid>
          <Button size="small" onClick={handleResetFilters} sx={{ mb: 3 }}>
            Limpiar filtros
          </Button>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : vehicles.length === 0 ? (
            <Alert severity="info">No se encontraron vehículos con los filtros seleccionados.</Alert>
          ) : (
            <Grid container spacing={3}>
              {vehicles.map((vehicle) => (
                <Grid item xs={12} md={6} lg={4} key={vehicle.id}>
                  <Card sx={{ height: '100%', borderRadius: 3 }}>
                    <CardMedia
                      component="img"
                      image={PLACEHOLDER_IMAGE}
                      alt={`${vehicle.brand?.name ?? ''} ${vehicle.category?.name ?? ''}`}
                      sx={{ height: 240 }}
                    />
                    <CardContent>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {vehicle.brand?.name ?? 'Marca'} {vehicle.category?.name ?? ''}
                        </Typography>
                        <VehicleStatusBadge status={vehicle.status} />
                      </Stack>
                      <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 700, mb: 1 }}>
                        {formatPrice(vehicle.price)}
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={1}
                        useFlexGap
                        flexWrap="wrap"
                        sx={{ mb: 2 }}
                      >
                        {vehicle.year && <Chip label={vehicle.year} size="small" />}
                        {vehicle.mileage != null && (
                          <Chip label={`${Number(vehicle.mileage).toLocaleString('es-CO')} km`} size="small" />
                        )}
                        {vehicle.engineType?.name && <Chip label={vehicle.engineType.name} size="small" />}
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        Revisión mecánica al día, documentación lista para
                        traspaso y entrega inmediata.
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ px: 2, pb: 2 }}>
                      <Button variant="contained" size="small" onClick={() => navigate(`/vehiculo/${vehicle.id}`)}>
                        Ver detalle
                      </Button>
                      <Button size="small" disabled>
                        Agendar visita
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={pagination.totalPages}
                page={page}
                onChange={(_e, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default HomePage;
