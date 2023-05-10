import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';

/** 同步单个设备(1500) */
export default async function syncOneDevice(req: Request, res: Response) {
    try {
        return res.json(toResponse(0));
    } catch (error: any) {
        logger.error(`get iHost token code error----------------: ${error.message}`);
        res.json(toResponse(500));
    }
}
