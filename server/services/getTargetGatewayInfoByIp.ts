import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import iHostApi from '../api/iHost';
import EErrorCode from '../ts/enum/EErrorCode';
import gatewayInfoUtil from '../utils/gatewayInfoUtil';

/** 通过ip获取相关网关信息(1100) */
export default async function getTargetGatewayInfoByIp(req: Request, res: Response) {
    try {
        const paramsIp = req.params.ip;
        const iHostRes = await iHostApi.getGatewayInfo(paramsIp);

        if (iHostRes.error !== 0 || !iHostRes.data) {
            return res.json(toResponse(EErrorCode.IP_CAN_NOT_CONNECT, 'fail to connect ip address'));
        }

        logger.info('getTargetGatewayInfoByIp api response--------------------', iHostRes.data);

        const gatewayInfo = iHostRes.data;

        await gatewayInfoUtil.setGatewayInfoByMac(gatewayInfo.mac, gatewayInfo);

        return res.json(toResponse(0, 'success', { data: iHostRes.data }));
    } catch (error: any) {
        logger.error(`getTargetGatewayInfoByIp code error----------------: ${error.message}`);
        res.json(toResponse(500));
    }
}
