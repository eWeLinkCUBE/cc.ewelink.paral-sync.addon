import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import gatewayMapUtil from '../utils/gatewayMapUtil';

/** 获取局域网内的iHost及NsPanelPro设备(1300) */
export default async function getSourceGatewayInLan(req: Request, res: Response) {
    try {
        const data = gatewayMapUtil.getMDnsGatewayList();

        logger.info('getSourceGatewayInLan api response--------------------', data);

        return res.json(toResponse(0, 'success', data));
    } catch (error: any) {
        logger.error(`getSourceGatewayInLan error----------------: ${error.message}`);
        res.json(toResponse(500));
    }
}
