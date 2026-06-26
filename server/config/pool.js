import pg from 'pg';

const env = (key, fallback = '') => {
  const val = process.env[key] ?? fallback;
  if (typeof val === 'string' && val.length >= 2) {
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      return val.slice(1, -1);
    }
  }
  return val;
};

const pool = new pg.Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: env('DATABASE_URL'),
        ssl: { rejectUnauthorized: false },
      }
    : {
        host: env('PGHOST', 'localhost'),
        port: Number(env('PGPORT', '5432')),
        user: env('PGUSER', 'postgres'),
        password: env('PGPASSWORD'),
        database: env('PGDATABASE', 'iia_event'),
      }
);

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

export default pool;
