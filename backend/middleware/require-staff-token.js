'use strict';

const jwt = require('jsonwebtoken');

function requireStaffToken(req, res, next) {
  const authorization = req.headers.authorization || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน' });
  }

  const secret = process.env.TOKEN_SECRET;
  if (!secret) {
    console.error('[AUTH] TOKEN_SECRET is not configured.');
    return res.status(500).json({ success: false, message: 'ระบบยืนยันตัวตนยังไม่ได้ตั้งค่า' });
  }

  try {
    const payload = jwt.verify(match[1], secret, { algorithms: ['HS256'], issuer: 'monk-status-api' });
    if (!payload || payload.role !== 'ST' || typeof payload.sub !== 'string' || !payload.sub) {
      return res.status(403).json({ success: false, message: 'บัญชีนี้ไม่มีสิทธิ์เข้าใช้งานระบบเจ้าหน้าที่' });
    }
    req.auth = { email: payload.sub, role: payload.role };
    return next();
  } catch (error) {
    // Log the verification failure category only. Never log the bearer token or secret.
    console.warn('[AUTH] JWT verification failed:', error && error.name ? error.name : 'UnknownError');
    return res.status(401).json({ success: false, message: 'Token ไม่ถูกต้องหรือหมดอายุ กรุณาเข้าสู่ระบบใหม่' });
  }
}

module.exports = requireStaffToken;
