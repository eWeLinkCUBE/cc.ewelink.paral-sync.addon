import _ from 'lodash';
import { Request, Response, NextFunction } from 'express';
import DB from '../utils/db';
import {
    ERR_NO_DEST_GATEWAY_MAC,
    ERR_NO_DEST_GATEWAY_INFO,
    ERR_DEST_GATEWAY_IP_INVALID,
    ERR_DEST_GATEWAY_TOKEN_INVALID,
    toResponse
} from '../utils/error';
import logger from '../log';

/**
 * 检查同步目标网关的中间件
 * 对于某些路由 service 来说，前提条件是保证同步目标网关的有效性
 */
export async function checkDestGateway(req: Request, res: Response, next: NextFunction) {
    const method = req.method;
    const url = req.url;

    // 获取所有设备的接口
    const match1 = (method === 'GET') && (url.includes('/api/v1/devices'));
    // 同步一个设备接口
    const match2 = (method === 'POST') && (url.includes('/api/v1/device'));
    // 同步所有设备接口
    const match3 = (method === 'POST') && (url.includes('/api/v1/devices'));

    if (match1 || match2 || match3) {
        logger.info(`(middle.checkDestGateway) matched`);
        // 检查同步目标网关
        const destGatewayMac = await DB.getDbValue('destGatewayMac');
        logger.info(`(middle.checkDestGateway) destGatewayMac: ${destGatewayMac}`);
        if (!destGatewayMac) {
            logger.info(`(middle.checkDestGateway) response: ERR_NO_DEST_GATEWAY_MAC`);
            return res.json(toResponse(ERR_NO_DEST_GATEWAY_MAC));
        }

        const localGatewayList = await DB.getDbValue('gatewayInfoList');
        logger.info(`(middle.checkDestGateway) localGatewayList: ${JSON.stringify(localGatewayList)}`);
        const destGatewayData = _.find(localGatewayList, { mac: destGatewayMac });
        if (!destGatewayData) {
            logger.info(`(middle.checkDestGateway) response: ERR_NO_DEST_GATEWAY_INFO`);
            return res.json(toResponse(ERR_NO_DEST_GATEWAY_INFO));
        }

        if (!destGatewayData.ipValid) {
            logger.info(`(middle.checkDestGateway) response: ERR_DEST_GATEWAY_IP_INVALID`);
            return res.json(toResponse(ERR_DEST_GATEWAY_IP_INVALID));
        }

        if (!destGatewayData.tokenValid) {
            logger.info(`(middle.checkDestGateway) response: ERR_DEST_GATEWAY_TOKEN_INVALID`);
            return res.json(toResponse(ERR_DEST_GATEWAY_TOKEN_INVALID));
        }
    }

    return next();
}
