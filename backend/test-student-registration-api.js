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
    const { studentId } = req.params;
    const { year, semester } = req.query;

    const pool = await dbConfigPool;
    connection = await pool.getConnection();

    const studentSql = `
      SELECT
        STD_CODE,
        PRENAME_NO,
        FIRST_NAME_THAI,
        MIDDLE_NAME_THAI,
        LAST_NAME_THAI,
        FACULTY_NO,
        MAJOR_NO
      FROM DBBACH00.UGB_STUDENT
      WHERE STD_CODE = :studentId
    `;

    const studentResult = await connection.execute(
      studentSql,
      { studentId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!studentResult.rows || studentResult.rows.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'ไม่พบข้อมูลนักศึกษา',
        student: null,
        registration: []
      });
    }

    const registrationSql = `
      SELECT *
      FROM DBBACH00.UGB_REGIS_RU24
      WHERE STD_CODE = :studentId
        AND YEAR = :year
        AND SEMESTER = :semester
    `;

    const registrationResult = await connection.execute(
      registrationSql,
      {
        studentId,
        year,
        semester
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const student = studentResult.rows[0];
    const registration = registrationResult.rows || [];

    if (registration.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'นักศึกษาไม่ได้ลงทะเบียนในภาคเรียนนี้',
        student,
        registration: []
      });
    }

    return res.status(200).json({
      success: true,
      student,
      registration
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
  console.log(`Student Registration Test API running on port ${PORT}`);
});
