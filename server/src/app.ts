import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import imageRoutes from './routes/image.routes';
import interviewRoutes from './routes/interview.routes';
import paymentRoutes from './routes/payment.routes';
import roomRoutes from './routes/room.routes';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

const app = express();

app.use(cors({
  origin: env.NODE_ENV === 'development'
    ? [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174']
    : env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running.',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/rooms', roomRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
