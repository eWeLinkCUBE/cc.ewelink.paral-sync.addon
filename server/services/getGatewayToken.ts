import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import db from '../utils/db';
import sse from '../ts/class/sse';

/** 获取iHost/NSPanelPro凭证(1200) */
export default async function getGatewayToken(req: Request, res: Response) {
    try {
        const { mac } = req.params;
        const result = await db.getDb()
        console.log("result => ", result);
        return res.json(toResponse(0));
    } catch (error: any) {
        logger.error(`get iHost token code error----------------: ${error.message}`);
        res.json(toResponse(500));
    }
}
