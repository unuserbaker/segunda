function getPagination(page, size) {
  const limit = size ? +size : 10; // Tamaño de página predeterminado: 10
  const offset = page > 0 ? (page - 1) * limit : 0; // Ajuste para que `page` comience desde 1

  return { limit, offset };
}

function getPagingData(data, offset = 0, limit = 0) {
  const { count: totalItems, rows } = data;

  const currentPage = limit ? Math.floor(offset / limit) + 1 : 1;
  const totalPages = limit ? Math.ceil(totalItems / limit) : 1;
  const auxlimit = limit || totalItems - offset;

  return {
    currentPage,
    limit: auxlimit,
    totalPages,
    totalItems,
    rows,
  };
}

exports.getPagination = getPagination;
exports.getPagingData = getPagingData; 