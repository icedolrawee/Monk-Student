'use strict';

async function main() {
  let pool;

  try {
    pool = require('../config/db/mysqlconfig');

    const [probeRows] = await pool.query('SELECT 1 AS connection_ok');
    const [databaseRows] = await pool.query('SELECT DATABASE() AS database_name');

    console.log('SELECT_1:', probeRows[0].connection_ok === 1 ? 'PASS' : 'FAIL');
    console.log('DATABASE:', databaseRows[0].database_name || '(none)');

    const expectedTables = ['ugb_student', 'ugb_regis_ru24', 'tempp'];
    const [tableRows] = await pool.execute(
      `SELECT TABLE_NAME
       FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE()
         AND LOWER(TABLE_NAME) IN (?, ?, ?)`,
      expectedTables
    );

    const visible = new Set(tableRows.map((row) => String(row.TABLE_NAME).toLowerCase()));

    for (const tableName of expectedTables) {
      if (!visible.has(tableName)) {
        console.log(`TABLE ${tableName}: NOT FOUND`);
        continue;
      }

      // Names come only from the fixed allowlist above; this query is read-only.
      const [countRows] = await pool.query(`SELECT COUNT(*) AS row_count FROM \`${tableName}\``);
      console.log(`TABLE ${tableName}: FOUND (rows=${countRows[0].row_count})`);
    }
  } catch (error) {
    const code = error && error.code ? String(error.code) : 'UNKNOWN_ERROR';
    if (code === 'MYSQL_CONFIG_MISSING') {
      console.error('MYSQL_TEST: BLOCKED - required MySQL environment variables are not configured.');
    } else if (code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('MYSQL_TEST: FAILED - MySQL rejected the configured application credentials (credentials omitted).');
    } else if (code === 'ECONNREFUSED') {
      console.error('MYSQL_TEST: FAILED - connection refused; verify the MySQL service and host/port.');
    } else if (code === 'ENOTFOUND' || code === 'ETIMEDOUT') {
      console.error(`MYSQL_TEST: FAILED - network/host connection error (${code}); credentials omitted.`);
    } else {
      console.error(`MYSQL_TEST: FAILED (${code}); error details omitted to avoid exposing sensitive information.`);
    }
    process.exitCode = 1;
  } finally {
    if (pool) {
      try {
        await pool.end();
        console.log('MYSQL_POOL: CLOSED');
      } catch {
        console.error('MYSQL_POOL: CLOSE_FAILED');
        process.exitCode = 1;
      }
    }
  }
}

main();
