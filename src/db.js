// db.js
import mysql from 'mysql2/promise';
// const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'mysql-176259-0.cloudclusters.net',
  user: 'admin', // Replace with your username
  password: 'vo3XfST8', // Replace with your password
  database: 'perfumeria',
//   connectionLimit: 10, // Adjust as needed
});

module.exports = pool;
