// src/index.ts
import cluster from 'cluster';
import os from 'os';
import dotenv from 'dotenv';
import express, { Application } from 'express';
import cors from 'cors';
import routes from './routes/v1/index.js';
import debugHelper from './core/helpers/debug.js';

dotenv.config();

const SERVER_PORT = Number(process.env.PORT) || 3000;
const ENV = process.env.NODE_ENV || 'development';
const NUM_CLUSTERS = Number(process.env.CLUSTERS) || os.cpus().length;
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://127.0.0.1:5173,http://localhost:5173')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

const corsOptions = {
    origin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
        const isLocalDevOrigin = !!origin && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

        if (!origin || allowedOrigins.includes(origin) || isLocalDevOrigin) {
            callback(null, true);
            return;
        }

        callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true
};

// Development: single worker, no clustering
if (ENV === 'development' || NUM_CLUSTERS <= 1) {
    const app: Application = express();
    app.use(cors(corsOptions));
    app.use(express.json());
    app.use('/api/v1', routes);

    app.listen(SERVER_PORT, () => {
        debugHelper.debug(`-----------------------------------------`);
        debugHelper.debug(`🚀 Server (DEV) running on http://localhost:${SERVER_PORT}/api/v1/hello`);
        debugHelper.debug(`🏥 Health Check: http://localhost:${SERVER_PORT}/api/v1/health`);
        debugHelper.debug(`📂 DB Target   : ${process.env.DATABASE_NAME} (${process.env.DATABASE_HOST})`);
        debugHelper.debug(`-----------------------------------------`);
    });

} else if (cluster.isMaster) {
    // Master process (production/staging)
    debugHelper.debug(`🛠 Master PID: ${process.pid}`);
    debugHelper.debug(`🚀 Forking ${NUM_CLUSTERS} workers...`);

    // Fork workers
    for (let i = 0; i < NUM_CLUSTERS; i++) {
        cluster.fork();
    }

    // Restart workers on exit
    cluster.on('exit', (worker, code, signal) => {
        debugHelper.debug(`⚠ Worker ${worker.process.pid} died (code: ${code}, signal: ${signal})`);
        // Optional: restart worker
        cluster.fork();
    });

    // Graceful shutdown
    function shutdown() {
        debugHelper.debug('🛑 Master shutting down all workers...');
        for (const id in cluster.workers) {
            cluster.workers[id]?.kill('SIGTERM');
        }
        process.exit(0);
    }

    process.on('SIGINT', shutdown);  // Ctrl+C
    process.on('SIGTERM', shutdown); // External stop

} else {
    // Worker process
    const app: Application = express();

    // Standard middleware
    app.use(cors(corsOptions));
    app.use(express.json());

    // Routes
    app.use('/api/v1', routes);

    const server = app.listen(SERVER_PORT, () => {
        debugHelper.debug(`-----------------------------------------`);
        debugHelper.debug(`🚀 Worker PID: ${process.pid} listening on http://localhost:${SERVER_PORT}/api/v1/hello`);
        debugHelper.debug(`🏥 Health Check: http://localhost:${SERVER_PORT}/api/v1/health`);
        debugHelper.debug(`📂 DB Target   : ${process.env.DATABASE_NAME} (${process.env.DATABASE_HOST})`);
        debugHelper.debug(`-----------------------------------------`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
        debugHelper.debug(`🛑 Worker PID: ${process.pid} shutting down...`);
        server.close(() => process.exit(0));
    });
}
