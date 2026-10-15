import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import opendataRoutes from './routes/opendataRoutes';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import path from 'path';
import dashboardRoutes from './routes/dashboardRoutes';
import categoryRoutes from './routes/categoryRoutes';
const app: Application = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true  // ← httpOnly cookie üçün VACİB
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());  // ← YENİ

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Server işləyir', timestamp: new Date().toISOString() });
});

// Routes
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/auth', authRoutes);         // ← YENİ
app.use('/api/v1/opendataRoutes', opendataRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/opendataRoutes', opendataRoutes);
app.use('/api/user', userRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);


// 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route tapılmadı' });
});

// Global error
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Xəta:', err.stack);
  res.status(500).json({ success: false, message: err.message || 'Daxili server xətası' });
});

export default app;