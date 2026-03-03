import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import * as dotenv from 'dotenv';

// 1. IMPORT ROUTES
import productRoutes from './routes/products';
import discountRoutes from './routes/discounts';
import donationRoutes from './routes/donations';
import analyticsRoutes from './routes/analytics';

import { errorHandler } from './middleware/errorHandler';
import { verifyToken } from './middleware/auth';
import { env } from './config/env';

dotenv.config();

// 2. INITIALIZE APP
const app: Express = express();

// 3. CONFIGURE CORS (Must be before routes)
// 'origin: true' allows your phone to connect while keeping credentials active
app.use(
  cors({
    origin: true, 
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

// Handle Pre-flight OPTIONS requests
app.options('*', cors());

// 4. PARSERS (Translates incoming data so your code can read it)
app.use(express.json({ limit: '10kb' })); 
app.use(bodyParser.urlencoded({ limit: '10kb', extended: true }));

// 5. PUBLIC ROUTES
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// 6. PROTECTED ROUTES (Requires Login Token)
app.use('/api/products', verifyToken, productRoutes);
app.use('/api/discounts', verifyToken, discountRoutes);
app.use('/api/donations', verifyToken, donationRoutes);
app.use('/api/analytics', verifyToken, analyticsRoutes);

// 7. ERROR HANDLING
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
  });
});

app.use(errorHandler);

export default app;