'use strict';

const oracledb = require('oracledb');
require('dotenv').config();

// Keep Oracle Pool creation lazy so MySQL-backed APIs can start without
// Oracle credentials. Existing Oracle models can continue using
// `await dbConfigPool` followed by `pool.getConnection()`.
let poolPromise = null;

function getPool() {
  if (!poolPromise) {
    const requiredEnv = [
      'NODE_ORACLEDB_USER',
      'NODE_ORACLEDB_PASSWORD',
      'NODE_ORACLEDB_CONNECTIONSTRING'
    ];
    const missingEnv = requiredEnv.filter(
      (name) => !process.env[name]
    );

    if (missingEnv.length > 0) {
      const error = new Error(
        `Oracle configuration is incomplete. Set: ${missingEnv.join(', ')}.`
      );
      error.code = 'ORACLE_CONFIG_MISSING';
      return Promise.reject(error);
    }

    poolPromise = oracledb.createPool({
      user: process.env.NODE_ORACLEDB_USER,
      password: process.env.NODE_ORACLEDB_PASSWORD,
      connectString: process.env.NODE_ORACLEDB_CONNECTIONSTRING,
      poolAlias: process.env.NODE_ORACLEDB_POOLALIAS || 'TR100',
      poolMax: 200,
      queueMax: 500,
      timezone: 'gmt+7'
    }).catch((error) => {
      poolPromise = null;
      throw error;
    });
  }

  return poolPromise;
}

// Export a pool-compatible facade. The pool is initialized only when an
// Oracle-dependent API requests a connection.
module.exports = {
  init: getPool,

  async getConnection(...args) {
    const pool = await getPool();
    return pool.getConnection(...args);
  },

  async close(timeout) {
    if (!poolPromise) {
      throw new Error('Oracle Pool has not been initialized.');
    }

    const pool = await poolPromise;
    await pool.close(timeout);
    poolPromise = null;
  }
};
