import _ from 'lodash';
import { Request, Response } from 'express';
import {
    ERR_CUBEAPI_GET_GATEWAY_TOKEN_TIMEOUT,
    ERR_DEST_GATEWAY_IP_INVALID,
    ERR_GATEWAY_IP_INVALID,
    ERR_INTERNAL_ERROR,
    ERR_NO_SUCH_GATEWAY,
    ERR_SUCCESS,
    toResponse,
} from '../utils/error';
import logger from '../log';
import DB from '../utils/db';
import CubeApi from '../lib/cube-api';
import CONFIG from '../config';

/** 获取iHost/NSPanelPro凭证(1200) */
export default async function getGatewayToken(req: Request, res: Response) {
    try {
        const dbs = await DB.getDb();

        logger.info('db--------------------', dbs);

        const ApiClient = CubeApi.ihostApi;

        /** 请求凭证的网关 MAC 地址 */
        const reqGatewayMac = req.params.mac;
        /** 请求凭证的网关可能是同步目标网关 */
        const reqGatewayMaybeDest = req.query.isSyncTarget === '1';

        logger.info(`(service.getGatewayToken) reqGatewayMac: ${reqGatewayMac}`);
        logger.info(`(service.getGatewayToken) reqGatewayMaybeDest: ${reqGatewayMaybeDest}`);

        if (reqGatewayMaybeDest) {
            // 请求凭证的网关可能是同步目标网关
            /** 本地存储的同步目标网关信息 */
            const localDestGatewayInfo = await DB.getDbValue('destGatewayInfo');
            logger.info(`(service.getGatewayToken) localDestGatewayInfo: ${localDestGatewayInfo}`);
            if (localDestGatewayInfo) {
                // 前端访问该接口时，同步目标网关信息一定存在
                if (!localDestGatewayInfo.ipValid) {
                    logger.info(`(service.getGatewayToken) RESPONSE: ERR_DEST_GATEWAY_IP_INVALID`);
                    return res.json(toResponse(ERR_DEST_GATEWAY_IP_INVALID));
                }

                if (!localDestGatewayInfo.tokenValid) {
                    // 如果同步目标网关的凭证已失效，则需要重新获取
                    const destApiClient = new ApiClient({ ip: localDestGatewayInfo.ip });
                    const cubeApiRes = await destApiClient.getBridgeAT({ timeout: CONFIG.getGatewayTokenTimeout });
                    logger.info(`(service.getGatewayToken) destApiClient.getBridgeAT() cubeApiRes: ${JSON.stringify(cubeApiRes)}`);

                    const resError = _.get(cubeApiRes, 'error');
                    const resData = _.get(cubeApiRes, 'data') as any;
                    if (resError === 0) {
                        // 更新本地存储的同步目标网关信息
                        localDestGatewayInfo.token = resData.token;
                        localDestGatewayInfo.tokenValid = true;
                        localDestGatewayInfo.ts = `${Date.now()}`;
                        logger.info(`(service.getGatewayToken) after update localDestGatewayInfo: ${JSON.stringify(localDestGatewayInfo)}`);
                        // TODO: acquire lock
                        await DB.setDbValue('destGatewayInfo', localDestGatewayInfo);

                        logger.info(`(service.getGatewayToken) RESPONSE: ERR_SUCCESS`);
                        return res.json(toResponse(ERR_SUCCESS, 'Success', localDestGatewayInfo));
                    } else {
                        logger.info(`(service.getGatewayToken) RESPONSE: ERR_CUBEAPI_GET_GATEWAY_TOKEN_TIMEOUT`);
                        return res.json(toResponse(ERR_CUBEAPI_GET_GATEWAY_TOKEN_TIMEOUT));
                    }
                } else {
                    // 同步目标网关的凭证未失效，直接返回给前端
                    logger.info(`(service.getGatewayToken) RESPONSE: ERR_SUCCESS`);
                    return res.json(toResponse(ERR_SUCCESS, 'Success', localDestGatewayInfo));
                }
            }
        } else {
            // 请求凭证的网关是同步来源网关
            /** 本地存储的同步来源网关信息列表 */
            const localSrcGatewayInfoList = await DB.getDbValue('srcGatewayInfoList');
            const i = _.findIndex(localSrcGatewayInfoList, { mac: reqGatewayMac });
            if (i === -1) {
                logger.info(`(service.getGatewayToken) RESPONSE: ERR_NO_SUCH_GATEWAY`);
                return res.json(toResponse(ERR_NO_SUCH_GATEWAY));
            }

            /** 本地存储的同步来源网关信息 */
            const localSrcGatewayInfo = localSrcGatewayInfoList[i];
            if (!localSrcGatewayInfo.ipValid) {
                logger.info(`(service.getGatewayToken) RESPONSE: ERR_GATEWAY_IP_INVALID`);
                return res.json(toResponse(ERR_GATEWAY_IP_INVALID));
            }

            if (!localSrcGatewayInfo.tokenValid) {
                // 同步来源网关的凭证已失效，重新获取
                const srcApiClient = new ApiClient({ ip: localSrcGatewayInfo.ip });
                const cubeApiRes = await srcApiClient.getBridgeAT({ timeout: CONFIG.getGatewayTokenTimeout });
                logger.info(`(service.getGatewayToken) srcApiClient.getBridgeAT() cubeApiRes: ${JSON.stringify(cubeApiRes)}`);

                const resError = _.get(cubeApiRes, 'error');
                const resData = _.get(cubeApiRes, 'data') as any;
                if (resError === 0) {
                    // 更新本地存储的同步来源网关信息
                    localSrcGatewayInfo.token = resData.token;
                    localSrcGatewayInfo.tokenValid = true;
                    localSrcGatewayInfo.ts = `${Date.now()}`;
                    logger.info(`(service.getGatewayToken) after update localSrcGatewayInfoList: ${JSON.stringify(localSrcGatewayInfoList)}`);
                    // TODO: acquire lock
                    await DB.setDbValue('srcGatewayInfoList', localSrcGatewayInfoList);

                    logger.info(`(service.getGatewayToken) RESPONSE: ERR_SUCCESS`);
                    return res.json(toResponse(ERR_SUCCESS, 'Success', localSrcGatewayInfo));
                } else {
                    logger.info(`(service.getGatewayToken) RESPONSE: ERR_CUBEAPI_GET_GATEWAY_TOKEN_TIMEOUT`);
                    return res.json(toResponse(ERR_CUBEAPI_GET_GATEWAY_TOKEN_TIMEOUT));
                }
            } else {
                // 同步来源网关的凭证未失效，直接返回给前端
                logger.info(`(service.getGatewayToken) RESPONSE: ERR_SUCCESS`);
                return res.json(toResponse(ERR_SUCCESS, 'Success', localSrcGatewayInfo));
            }
        }
    } catch (error: any) {
        logger.error(`get iHost token code error----------------: ${error.message}`);
        res.json(toResponse(ERR_INTERNAL_ERROR));
    }
}
