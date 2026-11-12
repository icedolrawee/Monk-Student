// Authen365 Integration
// Utility นี้มีหน้าที่ติดต่อ Authen365 เท่านั้น
// ส่ง email/password ไปตรวจสอบ และส่งผล Authentication กลับ Login Controller
//
// Authentication endpoint:
// POST https://service-regisapps.ru.ac.th/authen365/login
const AUTHEN365_URL = 'https://service-regisapps.ru.ac.th/authen365/login';

const Helper = {

    async microsoftLogin(username, password) {
        const params = new URLSearchParams();
        params.append('username', username);
        params.append('password', password);

        try {
            const authResponse = await fetch(AUTHEN365_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString(),
            });

            const contentType = authResponse.headers.get('content-type') || '';
            const responseText = await authResponse.text();

            let results;
            if (contentType.toLowerCase().includes('application/json')) {
                try {
                    results = responseText ? JSON.parse(responseText) : {};
                } catch {
                    return {
                        success: false,
                        message: 'Authen365 returned invalid JSON.',
                        results: []
                    };
                }
            } else {
                results = responseText;
            }

            if (!authResponse.ok) {
                return {
                    success: false,
                    message: 'E-mail or password invalid.',
                    results: []
                };
            }

            return {
                success: true,
                message: 'Login successful.',
                results
            };
        } catch (error) {
            return {
                success: false,
                message: 'Unable to connect to Authen365.',
                results: []
            };
        }
    }
};

module.exports = Helper;
