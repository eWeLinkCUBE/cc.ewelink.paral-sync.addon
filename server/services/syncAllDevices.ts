import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';

/** 同步所有设备(1600) */
export default async function syncAllDevices(req: Request, res: Response) {
    try {
        return res.json(toResponse(0));
    } catch (error: any) {
        logger.error(`get iHost token code error----------------: ${error.message}`);
        res.json(toResponse(500));
    }
}
