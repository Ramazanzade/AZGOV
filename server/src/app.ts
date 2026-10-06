import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dashboardRoutes from './routes/dashboardRoutes';

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server işləyir',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/v1/dashboard', dashboardRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route tapılmadı' });
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Xəta:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Daxili server xətası'
  });
});

export default app;