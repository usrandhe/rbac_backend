// Create Server Entry Point
import app from './app';
import { connectDatabase, disconnectDatabase } from './config/database';

import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 5000;

// start server
const startServer = async () => {
    try {
        await connectDatabase();

        const server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`URL: http://localhost:${PORT}`);
            console.log(`Health: http://localhost:${PORT}/health`);
            console.log(`API: http://localhost:${PORT}/api/${process.env.API_VERSION || 'v1'}`);
        });

        // polite shoutDown
        const shoutDown = async (signal: string) => {
            console.log(`\n${signal} received, shutting down gracefully...`);
            //await disconnectDatabase();
            server.close(async () => {
                console.log(`Server closed with signal: ${signal}`);
                await disconnectDatabase();
                process.exit(0);
            });

            //
            setTimeout(() => {
                console.log('Forcing shutdown...');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => shoutDown('SIGTERM'));
        process.on('SIGINT', () => shoutDown('SIGINT'));

    } catch (error) {
        console.error('Failed to connect to database:', error);
    }
};

startServer();
