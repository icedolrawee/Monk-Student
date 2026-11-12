'use strict';

const express = require('express');
const oracledb = require('oracledb');

require('dotenv').config();

const dbConfigPool = require('./config/db/dbconfigpool');

const app = express();
const PORT = 3000;

app.get('/student/:studentId', async (req, res) => {
  let connection;

  try {
    const pool = await dbConfigPool;
    connection = await pool.getConnection();

    const sql = `
      SELECT
        STD_CODE,
        PRENAME_NO,
        FIRST_NAME_THAI,
        MIDDLE_NAME_THAI,
        LAST_NAME_THAI,
        FACULTY_NO
      FROM DBBACH00.UGB_STUDENT
      WHERE STD_CODE = :studentId
    `;

    const result = await connection.execute(
      sql,
      { studentId: req.params.studentId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'ไม่พบข้อมูลนักศึกษา'
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error'
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error('Database connection close error:', closeError);
      }
    }
  }
});

app.listen(PORT, () => {
  console.log(`Student Test API running on port ${PORT}`);
});
