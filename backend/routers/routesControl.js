var express = require('express');
const app = express();
const bodyParser = require("body-parser");

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

const router = express.Router()

const pool = require('../controllers/db/ControllPool');
const requireStaffToken = require('../middleware/require-staff-token');

// Require a valid staff JWT for administrative/test routes.
router.use(requireStaffToken);

// ----- test --------------------------------
router.get('/closepool', pool.closePoolAndExit);


module.exports = router