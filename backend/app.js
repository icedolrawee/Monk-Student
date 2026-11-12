'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const WebSocket = require('ws');

require('dotenv').config();

Error.stackTraceLimit = 50;

const app = express();

// -----------------------------------------------------------------------------
// Environment / Application Configuration
// -----------------------------------------------------------------------------

app.set('trust proxy', true);

// -----------------------------------------------------------------------------
// Middleware
// -----------------------------------------------------------------------------

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(helmet());

// -----------------------------------------------------------------------------
// CORS
// -----------------------------------------------------------------------------

const corsOptions = {
  // Reflect only local development origins so credentialed browser requests do not
  // combine Access-Control-Allow-Credentials with a wildcard origin.
  origin: (origin, callback) => {
    if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors());

// -----------------------------------------------------------------------------
// API Routes
//
// Authentication Flow:
// Angular
//   → POST /api/service/login
//   → routers/routes.js
//   → Login Controller
//   → Authen365 authentication
//   → MONK_USER_LOGIN authorization
//   → Response กลับ Angular
//
// app.js ทำหน้าที่ Mount Routes เท่านั้น
// Business Logic ของ Login / Database อยู่ใน Controller / Utility
// -----------------------------------------------------------------------------

const routeControl = require('./routers/routesControl');
const routes = require('./routers/routes');
const frontendRoutes = require('./routers/frontend-route');
const studentRegistrationRoutes = require('./routers/student-registration-route');

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Api E-testing v1.' });
});

app.use('/api/doc', routes);
app.use('/api/service/frontend', frontendRoutes);
app.use('/api', studentRegistrationRoutes);
app.use('/api/service', routes);
// Mount the broad /api control router last so its JWT middleware cannot intercept
// public login endpoints mounted by the routers above.
app.use('/api/', routeControl);

// -----------------------------------------------------------------------------
// HTTP Server / WebSocket
// -----------------------------------------------------------------------------

const server = http.createServer(app);

new WebSocket.Server({ server });

server.keepAliveTimeout = 4000;

// -----------------------------------------------------------------------------
// Server Start
// -----------------------------------------------------------------------------

const PORT = Number(process.env.PORT) || 4000;

server.listen(PORT, '0.0.0.0', () => {
  console.log('listening on port..: ' + server.address().port);
});
