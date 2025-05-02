import { getRouteId } from '@/utils/functions';
import { useEffect, useState } from 'react';
import { useRouteLoaderData, useLocation } from 'react-router-dom';

const useTableAccion = (
  tableBodyData,
  headerTable,
  resetOnTableDataChange = true
) => {
  const { pathname } = useLocation();
  const { colors } = useRouteLoaderData(getRouteId(pathname));

  const [filter, setFilter] = useState('');
  const [rawBody, setRawBody] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [checkedItems, setCheckedItems] = useState({});

  useEffect(() => {
    if (tableBodyData) {
      setRawBody(
        tableBodyData.map((row, index) => ({
          ...row,
          rowIndex: index,
        }))
      );
    }
    resetOnTableDataChange && setPage(0); // Reset page when data changes
  }, [tableBodyData, resetOnTableDataChange]);

  useEffect(() => {
    const handleWindowResize = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      if (screenWidth >= 1940 && screenHeight >= 1080) {
        setRowsPerPage(10);
      } else if (screenWidth >= 1600 && screenHeight >= 1200) {
        setRowsPerPage(10);
      } else {
        setRowsPerPage(5);
      }
    };

    handleWindowResize();

    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  const handleClearFilter = () => {
    setFilter('');
  };

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredBody = rawBody.filter((row) => {
    return headerTable.reduce(
      (acum, header) =>
        acum ||
        `${row[header.key]}`.toLowerCase().includes(filter.toLowerCase()),
      false
    );
  });

  const paginatedBody = filteredBody.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return {
    filter,
    checkedItems,
    setCheckedItems,
    setFilter,
    handleClearFilter,
    handleChangePage,
    handleChangeRowsPerPage,
    page,
    rowsPerPage,
    filteredBody,
    paginatedBody,
    colors,
  };
};

export default useTableAccion;
