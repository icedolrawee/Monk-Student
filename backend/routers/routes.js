var express = require('express'); 

const router = express.Router()

// -------------------------------------
const test = require('../controllers/test');
const auth_sign = require('../controllers/auth/auth_sign');
const auth_login = require('../controllers/auth/microsoft/login');
const requireStaffToken = require('../middleware/require-staff-token');
const SelectDataController = require('../controllers/SelectModel');
const InsertDataController = require('../controllers/InsertModel'); 
const DeleteDataController = require('../controllers/DeleteModel');
//----------------------------------------------------------------
// -------------- Data controller --------------------------------
//const TABLE_RIA_COUNTER_ADMIN = require('../controllers/counter/DataControl_Counter');
// ------------- Event handlers ----------------------------------

// ------------ authentication --------------------
router.post('/sign', requireStaffToken, auth_sign.authenticateSignToken.sign_mid);
router.post('/verify', requireStaffToken, auth_sign.authenticateSignToken.verify_mid);
//-------------------------------------------------

// Login endpoint
// POST /api/service/login
// รับ email/password จาก Frontend แล้วส่งต่อให้ Login Controller
// เพื่อจัดการ Authentication และ Authorization
router.post('/login', auth_login.getMicrosoftLogin);

// Verify the JWT issued by /login. The middleware validates signature, expiry,
// issuer, and staff role before this handler can return success.
router.get('/verifytoken', requireStaffToken, (req, res) => {
  return res.status(200).json({
    success: true,
    valid: true,
    user: {
      email: req.auth.email,
      role: req.auth.role
    }
  });
});
// ------------------------------------------------

// All subsequent API endpoints in this router require a valid staff JWT.
// Keep login and the legacy sign/verify endpoints above this boundary.
router.use(requireStaffToken);

// Test selected access token
router.get('/select', test.TestGetSelectdb);
router.get('/testinsert/:x', InsertDataController.testinsert);
router.put('/send', test.TestrevData);


// ----- test model --------------------------------
router.post('/insertdb', InsertDataController.insertdb); 
router.delete('/deletedb', DeleteDataController.deletedb);

router.get('/testpool', SelectDataController.getSelectdb);
//----------------------------------------------------------------

// verify token
//router.get('/verify', bodyParser,getAccessToken.verifyAccessToken,);

// getting routes
//router.post('/getusers', bodyParser,getAccessToken.generateAccessToken);

module.exports = router;
