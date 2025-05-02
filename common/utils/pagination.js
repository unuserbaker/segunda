function getPagination(page, size) {
  const limit = size ? +size : 10; // Tamaño de página predeterminado: 10
  const offset = page > 0 ? (page - 1) * limit : 0; // Ajuste para que `page` comience desde 1

  return { limit, offset };
}

function getPagingData(data, offset = 0, limit = 0) {
  const { count: totalItems, rows } = data;
  if (totalItems) {
    let currentPage = 0;
    let totalPages = 0;
    if (!offset && !limit) {
      currentPage = 1;
      totalPages = 1;
    } else {
      currentPage = limit ? Math.ceil(offset / limit) + 1 : 2;
      totalPages = limit ? Math.ceil(totalItems / limit) : 2;
    }

    const auxlimit = limit || totalItems - offset;
    return { currentPage, limit: auxlimit, totalPages, totalItems, rows };
  }
  return undefined;
}

exports.getPagination = getPagination;
exports.getPagingData = getPagingData; 