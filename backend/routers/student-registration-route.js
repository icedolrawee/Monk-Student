'use strict';

const express = require('express');
const StudentRegistrationController = require('../controllers/student-registration.controller');
const requireStaffToken = require('../middleware/require-staff-token');

const router = express.Router();

router.get(
  '/students/monk-status',
  requireStaffToken,
  StudentRegistrationController.getSavedMonkStatusRecords
);

router.get(
  '/students/terms',
  requireStaffToken,
  StudentRegistrationController.getSystemTerms
);

router.get(
  '/students/:studentId/registration-history',
  requireStaffToken,
  StudentRegistrationController.getStudentRegistrationHistory
);

router.get(
  '/students/:studentId/registration',
  requireStaffToken,
  StudentRegistrationController.getStudentRegistration
);

router.post(
  '/students/monk-status',
  requireStaffToken,
  StudentRegistrationController.saveMonkStatus
);

router.delete(
  '/students/monk-status/:recordId',
  requireStaffToken,
  StudentRegistrationController.deleteSavedMonkStatusRecord
);

module.exports = router;
