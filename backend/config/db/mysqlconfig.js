'use strict';

require('dotenv').config();

const mysql = require('mysql2/promise');

const requiredEnv = ['MYSQL_USER'];
const missingEnv = requiredEnv.filter((name) => process.env[name] === undefined || process.env[name] === '');

if (missingEnv.length > 0) {
  const error = new Error(
    `MySQL configuration is incomplete. Set the required environment variable(s): ${missingEnv.join(', ')}.`
  );
  error.code = 'MYSQL_CONFIG_MISSING';
  throw error;
}

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE || 'test',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
