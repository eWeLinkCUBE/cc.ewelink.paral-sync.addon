import _ from 'lodash';
import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import DB from '../utils/db';
import { getGatewayToken as CubeApiGetGatewayToken } from '../api';

/** 获取iHost/NSPanelPro凭证(1200) */
export default async function getGatewayToken(req: Request, res: Response) {
    try {
        // 根据 mac 地址查找相应的网关信息
        const mac = req.params.mac.trim();
        const gatewayInfoList = await DB.getDbValue('gatewayInfoList');
        const i = _.findIndex(gatewayInfoList, { mac });
        logger.info(`(service.getGatewayToken) mac: ${mac}, gatewayInfoList: ${JSON.stringify(gatewayInfoList)}, i: ${i}`);
        if (i === -1) {
            return res.json(toResponse(501));
        }

        // 如果网关的 IP 无效，则返回报错信息
        const gatewayInfo = _.cloneDeep(gatewayInfoList[i]);
        logger.debug(`(service.getGatewayToken) gatewayInfo: ${JSON.stringify(gatewayInfo)}`);
        if (!gatewayInfo.ipValid) {
            return res.json(toResponse(502));
        }

        // 如果网关的凭证无效，则调用 eWeLink Cube API 的获取凭证接口并更新网关信息
        if (!gatewayInfo.tokenValid) {
            const tokenRes = await CubeApiGetGatewayToken(gatewayInfo.ip);
            if (tokenRes.error === -1) {
                return res.json(toResponse(1200));
            }

            // TODO: 上锁
            // TODO: 如果上锁了，不用重新获取数据
            const preUpdateList = await DB.getDbValue('gatewayInfoList');
            const updateIndex = _.findIndex(preUpdateList, { mac });
            logger.debug(`(service.getGatewayToken) before -> preUpdateList: ${JSON.stringify(preUpdateList)}, updateIndex: ${updateIndex}`);
            if (updateIndex === -1) {
                return res.json(toResponse(1201));
            }
            preUpdateList[updateIndex].token = tokenRes.data?.token as string;
            preUpdateList[updateIndex].tokenValid = true;
            preUpdateList[updateIndex].ts = `${Date.now()}`;
            await DB.setDbValue('gatewayInfoList', preUpdateList);
            logger.debug(`(service.getGatewayToken) after -> preUpdateList: ${JSON.stringify(preUpdateList)}`);
            return res.json(toResponse(0, 'Success', preUpdateList[updateIndex]));
        } else {
            return res.json(toResponse(0, 'Success', gatewayInfo));
        }
    } catch (error: any) {
        logger.error(`get iHost token code error----------------: ${error.message}`);
        res.json(toResponse(500));
    }
}
