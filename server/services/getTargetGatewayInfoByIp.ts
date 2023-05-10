import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';

/** 通过ip获取相关网关信息(1100) */
export default async function getTargetGatewayInfoByIp(req: Request, res: Response) {
    try {
        return res.json(toResponse(0));
    } catch (error: any) {
        logger.error(`get iHost token code error----------------: ${error.message}`);
        res.json(toResponse(500));
    }
}
