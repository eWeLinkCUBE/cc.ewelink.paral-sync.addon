import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import getGatewayInfo from './public/getGatewayInfo';
import EGatewayType from '../ts/enum/EGatewayType';

/** 通过ip获取相关网关信息(1100) */
export default async function getTargetGatewayInfoByIp(req: Request, res: Response) {
    try {
        const ip = req.params.ip;

        //接口获取网关信息
        const gatewayInfo = await getGatewayInfo(ip, EGatewayType.NS_PANEL_PRO);

        if (typeof gatewayInfo === 'number') {
            return res.json(toResponse(gatewayInfo));
        }

        logger.info('getTargetGatewayInfo api response--------------------', gatewayInfo);

        return res.json(toResponse(0, 'success', gatewayInfo));
    } catch (error: any) {
        logger.error(`getTargetGatewayInfoByIp code error----------------: ${error.message}`);
        res.json(toResponse(500));
    }
}
