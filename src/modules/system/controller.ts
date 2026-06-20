import { Request, Response } from 'express';
import { formatBytes } from '../../core/helpers/formatBytes.helper';

export const getHealth = (req: Request, res: Response) => {
    res.status(200).json({
        status: 'UP',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: {
            host: process.env.DATABASE_HOST,
            status: 'Connected' // Later, you can add real ping logic here
        }
    });
};

export const getHello = (req: Request, res: Response) => {
    res.status(200).json({
        status: true,
        message: 'Welcome to the Cloud Kitchen API',
        version: '1.0.0'
    });
};

export const getSystemInfo = (req: Request, res: Response) => {
    const memory = process.memoryUsage();

    res.status(200).json({
        platform: process.platform,
        nodeVersion: process.version,

        memoryUsage: {
            heapUsed: formatBytes(memory.heapUsed),
            heapTotal: formatBytes(memory.heapTotal),
            rss: formatBytes(memory.rss),
            external: formatBytes(memory.external),
        }
    });
};