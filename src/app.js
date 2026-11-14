import express from 'express';
import logger from '#config/logger.js';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import securityMiddleware from '#middleware/security.middleware.js';
import router from '#routes/auth.route.js';

const app = express();

// Shared middleware is registered before the route handlers so parsed requests,
// security headers, cookies, and request logs are available throughout the API.
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  morgan('combined', {
    stream: { write: message => logger.info(message.trim()) },
  })
);
app.use(cookieParser());

app.use(securityMiddleware);

app.get('/', (req, res) => {
  logger.info('Hello from Acquisitions!');
  res.status(200).send('Hello from Acquisitions!');
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/api', (req, res) => {
  res.status(200).json({ message: 'Acquisitions API is running !' });
});

// Keep authentication endpoints grouped under a single versionable API prefix.
app.use('/api/auth', router);

export default app;
