                                'use strict';

const mysqlPool = require('../config/db/mysqlconfig');

const STUDENT_SQL = `
  SELECT
    s.STD_CODE,
    s.PRENAME_NO,
    s.FIRST_NAME_THAI,
    s.MIDDLE_NAME_THAI,
    s.LAST_NAME_THAI,
    s.FACULTY_NO,
    s.MAJOR_NO,
    t.FACULTY_NAME_THAI,
    t.MAJOR_NAME_THAI
  FROM ugb_student s
  LEFT JOIN tempp t
    ON t.FACULTY_NO = s.FACULTY_NO
   AND t.MAJOR_NO = s.MAJOR_NO
  WHERE s.STD_CODE = ?
`;

const SYSTEM_TERMS_SQL = `
  SELECT DISTINCT
    YEAR,
    SEMESTER
  FROM ugb_regis_ru24
  WHERE YEAR IS NOT NULL
    AND YEAR <> '9999'
    AND SEMESTER IS NOT NULL
  ORDER BY YEAR DESC, SEMESTER ASC
`;

const REGISTRATION_SQL = `
  SELECT
    YEAR,
    SEMESTER,
    STD_CODE,
    CREDIT,
    COURSE_NO,
    NULL AS SECTION_NO
  FROM ugb_regis_ru24
  WHERE STD_CODE = ?
    AND YEAR = ?
    AND SEMESTER = ?
`;

const StudentRegistrationService = {
  async findStudentRegistration(studentId, year, semester) {
    const [studentRows] = await mysqlPool.execute(STUDENT_SQL, [studentId]);

    if (!studentRows || studentRows.length === 0) {
      return {
        foundStudent: false,
        student: null,
        registration: []
      };
    }

    let registration = [];

    if (year && semester) {
      const [registrationRows] = await mysqlPool.execute(REGISTRATION_SQL, [
        studentId,
        year,
        semester
      ]);
      registration = registrationRows || [];
    }

    return {
      foundStudent: true,
      student: studentRows[0],
      registration
    };
  },

  async getSystemTerms() {
    // Always query MySQL so newly inserted academic terms are visible immediately.
    return this.loadSystemTermsFromDatabase();
  },

  async loadSystemTermsFromDatabase() {
    const [rows] = await mysqlPool.execute(SYSTEM_TERMS_SQL);

    return (rows || []).map((row) => ({
      year: String(row.YEAR),
      semester: String(row.SEMESTER)
    }));
  },

  async getStudentRegistrationHistory(studentId) {
    const [studentRows] = await mysqlPool.execute(STUDENT_SQL, [studentId]);
    if (!studentRows || studentRows.length === 0) {
      return { student: null, registration: [] };
    }

    const [registrationRows] = await mysqlPool.execute(
      `SELECT YEAR, SEMESTER, STD_CODE, CREDIT, COURSE_NO, NULL AS SECTION_NO
       FROM ugb_regis_ru24
       WHERE STD_CODE = ?
         AND YEAR IS NOT NULL
         AND YEAR <> '9999'
         AND SEMESTER IS NOT NULL
       ORDER BY YEAR DESC, SEMESTER ASC, COURSE_NO ASC`,
      [studentId]
    );

    return { student: studentRows[0], registration: registrationRows || [] };
  },

  async getSavedMonkStatusRecords() {
    const [rows] = await mysqlPool.execute(
      `SELECT
         r.ID,
         r.STD_CODE,
         r.YEAR,
         r.SEMESTER,
         r.INSERT_USER,
         r.INSERT_DATE,
         s.FIRST_NAME_THAI,
         s.MIDDLE_NAME_THAI,
         s.LAST_NAME_THAI,
         s.FACULTY_NO,
         t.FACULTY_NAME_THAI,
         t.MAJOR_NAME_THAI
       FROM monk_status_record r
       LEFT JOIN ugb_student s ON s.STD_CODE = r.STD_CODE
       LEFT JOIN tempp t
         ON t.FACULTY_NO = s.FACULTY_NO
        AND t.MAJOR_NO = s.MAJOR_NO
       ORDER BY r.INSERT_DATE DESC, r.ID DESC`
    );
    return rows || [];
  },

  async deleteSavedMonkStatusRecord(recordId) {
    const [result] = await mysqlPool.execute(
      'DELETE FROM monk_status_record WHERE ID = ?',
      [recordId]
    );
    return result.affectedRows > 0;
  },

  async saveMonkStatus({ studentId, year, semester, insertUser }) {
    // Re-check student and registration on the server; never trust the UI alone.
    const [studentRows] = await mysqlPool.execute(STUDENT_SQL, [studentId]);
    if (!studentRows || studentRows.length === 0) {
      const error = new Error('ไม่พบข้อมูลนักศึกษา');
      error.code = 'STUDENT_NOT_FOUND';
      throw error;
    }

    const [termRows] = await mysqlPool.execute(REGISTRATION_SQL, [studentId, year, semester]);
    if (!termRows || termRows.length === 0) {
      const error = new Error('นักศึกษาไม่ได้ลงทะเบียนในภาคเรียนนี้');
      error.code = 'STUDENT_NOT_REGISTERED';
      throw error;
    }

    try {
      const [result] = await mysqlPool.execute(
        `INSERT INTO monk_status_record (STD_CODE, YEAR, SEMESTER, INSERT_USER, INSERT_DATE)
         VALUES (?, ?, ?, ?, NOW())`,
        [studentId, year, semester, insertUser]
      );
      return { id: result.insertId, studentId, year, semester, insertUser };
    } catch (error) {
      // Existing unique key on (STD_CODE, YEAR, SEMESTER) prevents duplicate records.
      if (error && error.code === 'ER_DUP_ENTRY') {
        const duplicateError = new Error('นักศึกษารายนี้มีข้อมูลสถานะพระในภาคเรียนนี้แล้ว');
        duplicateError.code = 'MONK_STATUS_ALREADY_EXISTS';
        throw duplicateError;
      }
      throw error;
    }
  }
};

module.exports = StudentRegistrationService;
