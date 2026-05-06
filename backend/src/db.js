import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'sql5.freesqldatabase.com',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'sql5825623',
  password: process.env.DB_PASSWORD || 'Uqrx4ekVDU',
  database: process.env.DB_NAME || 'sql5825623',
  waitForConnections: true,
  connectionLimit: 10
});

export default pool;
