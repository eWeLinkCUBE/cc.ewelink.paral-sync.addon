import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import db from '../utils/db';

/** 开关新增设备自动同步(1700) */
export default async function changeIsAutoSyncStatus(req: Request, res: Response) {
    try {
        const autoSync = await db.getDbValue('autoSync');
        return res.json(toResponse(0, 'success', { autoSync }));
    } catch (error: any) {
        logger.error(`changeIsAutoSyncStatus code error----------------: ${error.message}`);
        res.json(toResponse(500));
    }
}
