'use strict';

const StudentRegistrationService = require('../services/student-registration.service');

const StudentRegistrationController = {
  async getSystemTerms(req, res) {
    try {
      const terms = await StudentRegistrationService.getSystemTerms();
      return res.status(200).json({
        success: true,
        available_terms: terms
      });
    } catch (error) {
      console.error('Student registration terms database error:', error);
      return res.status(500).json({
        success: false,
        message: 'Database error',
        available_terms: []
      });
    }
  },

  async getStudentRegistration(req, res) {
    try {
      const { studentId } = req.params;
      const { year, semester } = req.query;

      const result = await StudentRegistrationService.findStudentRegistration(
        studentId,
        year,
        semester
      );

      if (!result.foundStudent) {
        return res.status(200).json({
          success: false,
          message: 'ไม่มีรหัสนักศึกษานี้ในระบบ',
          student: null,
          registration: []
        });
      }

      // A student lookup without both term parameters is not a registration failure.
      if (!year || !semester) {
        return res.status(200).json({
          success: true,
          student: result.student,
          registration: []
        });
      }

      if (result.registration.length === 0) {
        return res.status(200).json({
          success: false,
          message: 'นักศึกษาไม่ได้ลงทะเบียนในภาคเรียนนี้',
          student: result.student,
          registration: []
        });
      }

      return res.status(200).json({
        success: true,
        student: result.student,
        registration: result.registration
      });
    } catch (error) {
      console.error('Student registration database error:', error);
      return res.status(500).json({
        success: false,
        message: 'Database error'
      });
    }
  },

  async getStudentRegistrationHistory(req, res) {
    try {
      const studentId = String(req.params.studentId ?? '').trim();
      if (!/^\d{1,10}$/.test(studentId)) {
        return res.status(400).json({ success: false, message: 'รหัสนักศึกษาไม่ถูกต้อง', student: null, registration: [] });
      }

      const result = await StudentRegistrationService.getStudentRegistrationHistory(studentId);
      if (!result.student) {
        return res.status(200).json({ success: false, message: 'ไม่พบข้อมูลนักศึกษา', student: null, registration: [] });
      }

      return res.status(200).json({
        success: true,
        student: result.student,
        registration: result.registration
      });
    } catch (error) {
      console.error('Student registration history database error:', error);
      return res.status(500).json({ success: false, message: 'โหลดประวัติการลงทะเบียนไม่สำเร็จ กรุณาตรวจสอบฐานข้อมูล', student: null, registration: [] });
    }
  },

  async getSavedMonkStatusRecords(req, res) {
    try {
      const records = await StudentRegistrationService.getSavedMonkStatusRecords();
      return res.status(200).json({ success: true, records });
    } catch (error) {
      console.error('Get saved monk status records database error:', error);
      return res.status(500).json({
        success: false,
        message: 'โหลดรายการข้อมูลที่บันทึกไม่สำเร็จ กรุณาตรวจสอบฐานข้อมูล',
        records: []
      });
    }
  },

  async deleteSavedMonkStatusRecord(req, res) {
    const recordId = String(req.params.recordId ?? '').trim();
    if (!/^\d+$/.test(recordId) || Number(recordId) < 1) {
      return res.status(400).json({ success: false, message: 'รหัสรายการที่ต้องการลบไม่ถูกต้อง' });
    }

    try {
      const deleted = await StudentRegistrationService.deleteSavedMonkStatusRecord(Number(recordId));
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'ไม่พบรายการที่ต้องการลบ' });
      }
      return res.status(200).json({ success: true, message: 'ลบรายการบันทึกสำเร็จ' });
    } catch (error) {
      console.error('Delete saved monk status record database error:', error);
      return res.status(500).json({ success: false, message: 'ลบรายการบันทึกไม่สำเร็จ กรุณาลองอีกครั้ง' });
    }
  },

  async saveMonkStatus(req, res) {
    const studentId = typeof req.body?.studentId === 'string' ? req.body.studentId.trim() : '';
    const year = typeof req.body?.year === 'string' ? req.body.year.trim() : String(req.body?.year ?? '').trim();
    const semester = typeof req.body?.semester === 'string' ? req.body.semester.trim() : String(req.body?.semester ?? '').trim();
    const insertUser = req.auth?.email;

    if (!/^\d{1,10}$/.test(studentId) || !/^\d{4}$/.test(year) || !/^[1-5]$/.test(semester)) {
      return res.status(400).json({ success: false, message: 'กรุณาตรวจสอบรหัสนักศึกษา ปีการศึกษา และภาคการศึกษาให้ถูกต้อง' });
    }

    if (typeof insertUser !== 'string' || !insertUser.trim()) {
      return res.status(401).json({ success: false, message: 'ไม่พบข้อมูลเจ้าหน้าที่ผู้บันทึก กรุณาเข้าสู่ระบบใหม่' });
    }

    try {
      const saved = await StudentRegistrationService.saveMonkStatus({
        studentId,
        year,
        semester,
        insertUser: insertUser.trim()
      });

      return res.status(201).json({
        success: true,
        message: 'บันทึกสถานะพระสำเร็จ',
        record: saved
      });
    } catch (error) {
      if (error?.code === 'STUDENT_NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลนักศึกษา' });
      }
      if (error?.code === 'STUDENT_NOT_REGISTERED') {
        return res.status(400).json({ success: false, message: 'นักศึกษาไม่ได้ลงทะเบียนในภาคเรียนนี้' });
      }
      if (error?.code === 'MONK_STATUS_ALREADY_EXISTS' || error?.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, message: 'นักศึกษารายนี้มีข้อมูลสถานะพระในภาคเรียนนี้แล้ว' });
      }

      console.error('Save monk status database error:', error);
      return res.status(500).json({ success: false, message: 'บันทึกสถานะพระไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อฐานข้อมูลและลองอีกครั้ง' });
    }
  }
};

module.exports = StudentRegistrationController;
