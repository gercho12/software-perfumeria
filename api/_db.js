// Shared MySQL pool for Vercel serverless functions
const mysql = require('mysql2/promise');

let pool;

function getPool() {
  if (!pool) {
    const host = process.env.DB_HOST || 'mysql-176259-0.cloudclusters.net';
    const user = process.env.DB_USER || 'admin';
    const password = process.env.DB_PASSWORD || 'vo3XfST8';
    const database = process.env.DB_DATABASE || 'perfumeria';
    const port = parseInt(process.env.DB_PORT, 10) || 19902;
    pool = mysql.createPool({
      host,
      user,
      password,
      database,
      port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

module.exports = { getPool };


