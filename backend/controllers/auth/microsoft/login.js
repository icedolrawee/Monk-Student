
const axios = require('axios');
const jwt = require('jsonwebtoken');

const mysqlPool = require('../../../config/db/mysqlconfig');
const Authen = require('../../../utils/microsoft/login');

const DataController = {

    // Login Flow
    // 1. รับ email/password จาก Frontend
    // 2. ส่งข้อมูลไปตรวจสอบกับ Authen365 (Authentication)
    // 3. หาก Authentication สำเร็จ ตรวจสอบ EMAIL ใน MONK_USER_LOGIN
    // 4. ตรวจสอบ ROLE = 'ST' (Local Authorization / Staff Allowlist)
    // 5. ส่งผล Login กลับไปยัง Frontend
    //
    // Authen365 = Authentication
    // MONK_USER_LOGIN = Local Authorization / Staff Allowlist
    // ROLE = ST = สิทธิ์เจ้าหน้าที่ตามระบบปัจจุบัน
    async getMicrosoftLogin(req, res) {

        try {
            const { email, password } = req.body;
            //  console.log(req.body);

            if (!email) {
                return res.status(200).json({ "success": false, "message": 'Unauthorized Access' });
            }

            const auth = process.env.LOGIN_TEST_MODE === 'true'
                ? { success: true, message: 'Temporary test authentication successful.', results: { testMode: true } }
                : await Authen.microsoftLogin(email, password);
            if (!auth.success) {
                console.warn('[LOGIN] Authentication failed before MySQL authorization.');
                return res.status(200).json({ success: false, message: auth.message });
            }

            const normalizedEmail = String(email).trim().toLowerCase();
            const [results_user] = await mysqlPool.execute(
                `SELECT EMAIL, INSERT_DATE, INSERT_USER, ROLE
                 FROM MONK_USER_LOGIN
                 WHERE LOWER(TRIM(EMAIL)) = ?`,
                [normalizedEmail]
            );

            if (results_user.length === 0) {
                console.warn('[LOGIN] Authenticated account was not found in MySQL MONK_USER_LOGIN.');
                return res.status(401).json({
                    success: false,
                    message: 'User does not have permission to access this system.'
                });
            }

            const user = results_user[0];
            if (user.ROLE !== 'ST') {
                console.warn('[LOGIN] MySQL account found but staff role check failed.');
                return res.status(401).json({
                    success: false,
                    message: 'User does not have permission to access this system.'
                });
            }

            const tokenSecret = process.env.TOKEN_SECRET;
            if (!tokenSecret || tokenSecret.length < 32) {
                console.error('[LOGIN] TOKEN_SECRET is missing or too short.');
                return res.status(500).json({
                    success: false,
                    message: 'ระบบยืนยันตัวตนยังไม่ได้ตั้งค่า'
                });
            }

            const token = jwt.sign(
                { role: user.ROLE },
                tokenSecret,
                {
                    algorithm: 'HS256',
                    subject: String(user.EMAIL).trim().toLowerCase(),
                    issuer: 'monk-status-api',
                    expiresIn: '1h'
                }
            );

            const results = {
                EMAIL: user.EMAIL,
                ROLE: user.ROLE,
                INSERT_DATE: user.INSERT_DATE,
                INSERT_USER: user.INSERT_USER
            };

            return res.status(200).json({ success: true, message: '', token, results });

        } catch (error) {
            console.error('[LOGIN] Login request failed:', error.code || error.name || 'UnknownError');
            return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง' });
        }

    },

}

/* function getLogin(res, username, password) {
    // const data = `{ "username":"anusorn.w@ru.ac.th", "password":"Awongod27"}`;
    const data = `{"username":"${username}","password":"${password}"}`;

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `http://202.41.160.113:1323/login?username=${username}&password=${password}`,
        headers: {
            'Content-Type': 'text/plain'
        },
        data: data
    };

    axios.request(config)
        .then((response) => {
            console.log(JSON.stringify(response.data));
            let data = response.data;
            res.status(200).json({ "success": true, data });
            // return response.data;
        })
        .catch((error) => {
            console.log(error);
            res.status(200).json({ "success": false, error });
            // return error;
        }); 
}*/


module.exports = DataController;

