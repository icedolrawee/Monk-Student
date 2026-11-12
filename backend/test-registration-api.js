'use strict';

const express = require('express');
const oracledb = require('oracledb');

require('dotenv').config();

const dbConfigPool = require('./config/db/dbconfigpool');

const app = express();
const PORT = 3000;

app.get('/registration/:studentId/:year/:semester', async (req, res) => {
  let connection;

  try {
    const pool = await dbConfigPool;
    connection = await pool.getConnection();

    const sql = `
      SELECT *
      FROM DBBACH00.UGB_REGIS_RU24
      WHERE STD_CODE = :studentId
        AND YEAR = :year
        AND SEMESTER = :semester
    `;

    const result = await connection.execute(
      sql,
      {
        studentId: req.params.studentId,
        year: req.params.year,
        semester: req.params.semester
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'นักศึกษาไม่ได้ลงทะเบียนในภาคเรียนนี้',
        data: []
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
  console.log(`Registration Test API running on port ${PORT}`);
});
