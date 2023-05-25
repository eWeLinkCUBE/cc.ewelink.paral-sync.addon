import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import _ from 'lodash';
import getGatewayInfo from './public/getGatewayInfo';
import EGatewayType from '../ts/enum/EGatewayType';
import config from '../config';

/** 获取本机网关信息(1000) */
export default async function getTargetGatewayInfo(req: Request, res: Response) {
    try {
        const gatewayInfo = await getGatewayInfo(config.iHost.ip, EGatewayType.IHOST);

        if (typeof gatewayInfo === 'number') {
            return res.json(toResponse(gatewayInfo));
        }

        logger.info('getTargetGatewayInfo api response--------------------', gatewayInfo);

        return res.json(toResponse(0, 'success', gatewayInfo));
    } catch (error: any) {
        logger.error(`getTargetGatewayInfo code error----------------: ${error.message}`);
        res.json(toResponse(500));
    }
}
