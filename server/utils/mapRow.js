/** Convert PostgreSQL snake_case row to camelCase. */
export const mapRow = (row) => {
  if (!row) return null;
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = value;
  }
  return out;
};

export const mapRows = (rows) => rows.map(mapRow);
