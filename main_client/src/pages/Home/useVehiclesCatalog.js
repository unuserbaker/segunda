import { useCallback, useEffect, useState } from 'react';
import { getVehicles } from '@/core/services/vehicles_service/vehicles.js';
import { getBrands } from '@/core/services/vehicles_service/brands.js';
import { getCategories } from '@/core/services/vehicles_service/categories.js';
import { getTypes } from '@/core/services/vehicles_service/type.js';

// Hook independiente para la landing pública. No se comparte con
// `Admin/Vehicles/useVehicles.js` (ese usa react-router loaders y está
// acoplado al flujo de admin autenticado); aquí el catálogo es público,
// sin loader y con filtros propios, así que un hook separado mantiene
// bajo riesgo/mínimo diff en ambos lados.
const CATALOG_REFERENCE_SIZE = 100; // catálogos de referencia son pocas filas hoy

const DEFAULT_FILTERS = {
  brandId: '',
  categoryId: '',
  typeId: '',
  minPrice: '',
  maxPrice: '',
};

const formatVehiclesData = (vehicles = []) => vehicles.map((vehicle) => ({ ...vehicle }));

const useVehiclesCatalog = () => {
  const [vehicles, setVehicles] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadReferenceData = useCallback(async () => {
    try {
      const [brandsRes, categoriesRes, typesRes] = await Promise.all([
        getBrands({ size: CATALOG_REFERENCE_SIZE }),
        getCategories({ size: CATALOG_REFERENCE_SIZE }),
        getTypes({ size: CATALOG_REFERENCE_SIZE }),
      ]);
      setBrands(brandsRes?.rows ?? []);
      setCategories(categoriesRes?.rows ?? []);
      setTypes(typesRes?.rows ?? []);
    } catch (err) {
      console.log(err?.message, 'error cargando catálogos de referencia');
    }
  }, []);

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        size: pagination.limit,
        ...(filters.brandId ? { brandId: filters.brandId } : {}),
        ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
        ...(filters.minPrice !== '' ? { minPrice: filters.minPrice } : {}),
        ...(filters.maxPrice !== '' ? { maxPrice: filters.maxPrice } : {}),
      };
      // GET /vehicles devuelve el shape de paginación directamente
      // { currentPage, limit, totalPages, totalItems, rows }, no envuelto en `record`.
      const { rows, currentPage, limit, totalPages, totalItems } = await getVehicles(params);

      // `typeId` no está soportado hoy por el backend (`VehicleFilterDto` solo
      // acepta brandId/categoryId/minPrice/maxPrice), se aplica client-side.
      const filteredRows = filters.typeId
        ? (rows ?? []).filter((v) => v.type_id === filters.typeId || v.typeId === filters.typeId)
        : rows;

      setVehicles(formatVehiclesData(filteredRows));
      setPagination({ currentPage, limit, totalPages, totalItems });
    } catch (err) {
      setError(err?.message ?? 'Error cargando vehículos');
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, [page, pagination.limit, filters]);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  useEffect(() => {
    loadVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

  const handleFilterChange = (name, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleResetFilters = () => {
    setPage(1);
    setFilters(DEFAULT_FILTERS);
  };

  return {
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
  };
};

export default useVehiclesCatalog;
