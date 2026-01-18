// Create Express App
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { errorHandler, notFoundHandler } from './middlewares/errorHandlers';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';

const app: Application = express();

app.use(helmet());


app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// compression
app.use(compression());

// Loggging 
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Helath Checkup
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
    });
});

const API_VERSION = process.env.API_VERSION || 'v1';
app.get(`/api/${API_VERSION}`, (req, res) => {
    res.json({
        message: 'RBAC API is running',
        version: API_VERSION,
        timestamp: new Date().toISOString(),
        endpoints: {
            auth: `/api/${API_VERSION}/auth`,
            users: `/api/${API_VERSION}/users`,
        },
    });
});

app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/users`, userRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;