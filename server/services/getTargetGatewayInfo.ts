import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';

/** 获取本机网关信息(1000) */
export default async function getTargetGatewayInfo(req: Request, res: Response) {
    try {
        return res.json(toResponse(0));
    } catch (error: any) {
        logger.error(`get iHost token code error----------------: ${error.message}`);
        res.json(toResponse(500));
    }
}
