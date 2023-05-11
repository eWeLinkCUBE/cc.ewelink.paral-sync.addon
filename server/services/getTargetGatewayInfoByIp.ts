import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import iHostApi from '../api/iHost';
import EErrorCode from '../ts/enum/EErrorCode';

interface IGatewayInfo {
    /** ip地址 */
    ip: string;
    /**  mac地址 */
    mac: string;
    /* 域名 */
    domain: string;
}

/** 通过ip获取相关网关信息(1100) */
export default async function getTargetGatewayInfoByIp(req: Request, res: Response) {
    try {
        const paramsIp = req.params.ip;
        const iHostRes = await iHostApi.getGatewayInfo();

        if (iHostRes.error !== 0 || !iHostRes.data) {
            throw new Error('can not get gateway info');
        }

        const { ip, mac, domain } = iHostRes.data;
        logger.info('iHostRes----------------------', iHostRes);

        if (paramsIp !== ip) {
            return res.json(toResponse(EErrorCode.IP_CAN_NOT_CONNECT, 'fail to connect IP address'));
        }

        const data: IGatewayInfo = {
            ip,
            mac,
            domain,
        };

        logger.info('getTargetGatewayInfoByIp api response--------------------', data);

        return res.json(toResponse(0, 'success', { data }));
    } catch (error: any) {
        logger.error(`getTargetGatewayInfoByIp code error----------------: ${error.message}`);
        res.json(toResponse(500));
    }
}
