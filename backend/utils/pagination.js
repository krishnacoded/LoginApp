const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const buildPaginationMeta = (total, page, limit) => {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1,
  };
};

const buildSortQuery = (sortBy, sortOrder, allowedFields) => {
  const direction = sortOrder?.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  if (!sortBy || !allowedFields.includes(sortBy)) {
    return `ORDER BY created_at DESC`;
  }
  return `ORDER BY ${sortBy} ${direction}`;
};

module.exports = { getPaginationParams, buildPaginationMeta, buildSortQuery };