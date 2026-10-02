// Conexão com o Postgres (usada só quando DATABASE_URL existe).
const { Pool } = require('pg');

let pool = null;

function getPool() {
  if (pool) return pool;

  const useSsl = process.env.PGSSL !== 'disable';
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: useSsl ? { rejectUnauthorized: false } : false
  });
  return pool;
}

// Permite trocar o pool (útil em testes).
function setPool(customPool) {
  pool = customPool;
}

module.exports = { getPool, setPool };
