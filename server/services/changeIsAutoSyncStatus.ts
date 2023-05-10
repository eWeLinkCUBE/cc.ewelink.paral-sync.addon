import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';

/** 开关新增设备自动同步(1700) */
export default async function changeIsAutoSyncStatus(req: Request, res: Response) {
    try {
        return res.json(toResponse(0));
    } catch (error: any) {
        logger.error(`get iHost token code error----------------: ${error.message}`);
        res.json(toResponse(500));
    }
}
