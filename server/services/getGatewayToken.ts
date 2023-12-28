import _ from 'lodash';
import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import DB from '../utils/db';
import CubeApi from '../lib/cube-api';
import CONFIG from '../config';
import SSE from '../ts/class/sse';
import { destTokenInvalid, srcTokenAndIPInvalid } from '../utils/dealError';
import sseUtils from '../utils/sseUtils';
import { getSrcGatewayDeviceGroup } from '../utils/tmp';

/** 获取iHost/NSPanelPro凭证(1200) */
/** Get iHost/ns panel pro certificate (1200) */
export default async function getGatewayToken(req: Request, res: Response) {
    // let lockId: string | null = null;

    /** 是否已经返回了数据 */
    /** Whether data has been returned */
    let hasReturn = false;

    try {
        // lockId = await acquireLock({ retryCount: 20 });
        // if (!lockId) {
        // logger.info(`(service.getGatewayToken) RESPONSE: ERR_DB_LOCK_BUSY`);
        // return res.json(toResponse(ERR_DB_LOCK_BUSY));
        // }

        const ApiClient = CubeApi.ihostApi;
        /** 
        * 请求凭证的网关 MAC 地址 
        * Gateway MAC address for requesting credentials 
        */
        const reqGatewayMac = req.params.mac;
        /** 
        * 请求凭证的网关可能是同步目标网关
        * The gateway requesting credentials may be the sync target network
        */
        const reqGatewayMaybeDest = req.query.isSyncTarget === '1';
        logger.info(`(service.getGatewayToken) reqGatewayMac: ${reqGatewayMac}`);
        logger.info(`(service.getGatewayToken) reqGatewayMaybeDest: ${reqGatewayMaybeDest}`);

        if (reqGatewayMaybeDest) { // 请求凭证的网关可能是同步目标网关 The gateway requesting credentials may be the sync target gateway
            /**
            * 本地存储的同步目标网关信息
            * Locally stored synchronization target gateway information
            */
            const localDestGatewayInfo = await DB.getDbValue('destGatewayInfo');
            logger.info(`(service.getGatewayToken) localDestGatewayInfo: ${localDestGatewayInfo}`);
            // 前端访问该接口时，同步目标网关信息一定存在 
            // When the front end accesses this interface, the synchronization target gateway information must exist
            if (localDestGatewayInfo) {
                if (!localDestGatewayInfo.ipValid) {
                    logger.info(`(service.getGatewayToken) RESPONSE: ERR_DEST_GATEWAY_IP_INVALID`);
                    return res.json(toResponse(702));
                }
                // 如果同步目标网关的凭证已失效，则需要重新获取
                // If the credentials of the synchronization target gateway have expired, you need to obtain them again.
                if (!localDestGatewayInfo.tokenValid) {
                    // 将当前请求时间写入网关信息中
                    // Write the current request time into the gateway information
                    localDestGatewayInfo.ts = `${Date.now()}`;
                    await DB.setDbValue('destGatewayInfo', localDestGatewayInfo);
                    // 直接返回网关信息给前端
                    // Return gateway information directly to the front end
                    logger.info(`(service.getGatewayToken) RESPONSE: ERR_SUCCESS`);
                    hasReturn = true;
                    res.json(toResponse(0, 'Success', localDestGatewayInfo));

                    // 通过 SSE 通知前端，开始获取网关凭证
                    // Notify the frontend via SSE to start obtaining gateway credentials
                    logger.info(`(service.getGatewayToken) SSE.send(): begin_obtain_token_report`);
                    SSE.send({
                        name: 'begin_obtain_token_report',
                        data: localDestGatewayInfo
                    });

                    const destApiClient = new ApiClient({ ip: localDestGatewayInfo.ip });
                    const cubeApiRes = await destApiClient.getBridgeAT({ timeout: CONFIG.getGatewayTokenTimeout }, CONFIG.nodeApp.name);
                    logger.debug(`(service.getGatewayToken) destApiClient.getBridgeAT() cubeApiRes: ${JSON.stringify(cubeApiRes)}`);

                    const resError = _.get(cubeApiRes, 'error');
                    const resData = _.get(cubeApiRes, 'data') as any;
                    if (resError === 0) {
                        // 更新本地存储的同步目标网关信息
                        // 更New locally stored sync target gateway information
                        localDestGatewayInfo.token = resData.token;
                        localDestGatewayInfo.tokenValid = true;
                        logger.info(`(service.getGatewayToken) after update localDestGatewayInfo: ${JSON.stringify(localDestGatewayInfo)}`);
                        await DB.setDbValue('destGatewayInfo', localDestGatewayInfo);

                        // 通过 SSE 通知前端，网关凭证已经拿到
                        // Notify the front end through SSE that the gateway credentials have been obtained
                        logger.info(`(service.getGatewayToken) SSE.send(): obtain_token_success_report`);
                        SSE.send({
                            name: 'obtain_token_success_report',
                            data: localDestGatewayInfo
                        });
                        // 拉起sse
                        // Pull up sse
                        await sseUtils.checkForSse();
                        return;
                    } else {
                        // 通过 SSE 通知前端，网关凭证获取失败
                        // Notify the frontend via SSE that gateway credential acquisition failed
                        logger.info(`(service.getGatewayToken) SSE.send(): obtain_token_fail_report`);
                        SSE.send({
                            name: 'obtain_token_fail_report',
                            data: localDestGatewayInfo
                        });
                        await destTokenInvalid();
                        return;
                    }
                } else {
                    // 同步目标网关的凭证未失效，直接返回给前端
                    // The credentials of the synchronized target gateway have not expired and are returned directly to the front end.
                    logger.info(`(service.getGatewayToken) RESPONSE: ERR_SUCCESS`);
                    return res.json(toResponse(0, 'Success', localDestGatewayInfo));
                }
            }
        } else { // 请求凭证的网关是同步来源网关 The gateway requesting credentials is the sync source gateway
            /** 
            * 本地存储的同步来源网关信息列表
            * Locally stored synchronization source gateway information list
            */
            const localSrcGatewayInfoList = await DB.getDbValue('srcGatewayInfoList');
            const i = _.findIndex(localSrcGatewayInfoList, { mac: reqGatewayMac });
            if (i === -1) {
                logger.info(`(service.getGatewayToken) RESPONSE: ERR_NO_SRC_GATEWAY_INFO`);
                return res.json(toResponse(1500));
            }

            /** 
            * 本地存储的同步来源网关信息
            * Locally stored synchronization source gateway information
             */
            const localSrcGatewayInfo = localSrcGatewayInfoList[i];
            if (!localSrcGatewayInfo.ipValid) {
                logger.info(`(service.getGatewayToken) RESPONSE: ERR_SRC_GATEWAY_IP_INVALID`);
                return res.json(toResponse(1501));
            }

            if (!localSrcGatewayInfo.tokenValid) { // 同步来源网关的凭证已失效，重新获取 The certificate of the synchronization source gateway has expired. Please obtain it again.
                // 将当前请求时间写入网关信息中
                // Write the current request time into the gateway information
                localSrcGatewayInfo.ts = `${Date.now()}`;
                await DB.setDbValue('srcGatewayInfoList', localSrcGatewayInfoList);
                // 直接返回网关信息给前端
                // Return gateway information directly to the front end
                logger.info(`(service.getGatewayToken) RESPONSE: ERR_SUCCESS`);
                hasReturn = true;
                res.json(toResponse(0, 'Success', localSrcGatewayInfo));

                // 通过 SSE 通知前端，开始获取网关凭证
                // Notify the frontend via SSE to start obtaining gateway credentials
                logger.info(`(service.getGatewayToken) SSE.send(): begin_obtain_token_report`);
                SSE.send({
                    name: 'begin_obtain_token_report',
                    data: localSrcGatewayInfo
                });

                const srcApiClient = new ApiClient({ ip: localSrcGatewayInfo.ip });
                const cubeApiRes = await srcApiClient.getBridgeAT({ timeout: CONFIG.getGatewayTokenTimeout }, CONFIG.nodeApp.name);
                logger.debug(`(service.getGatewayToken) srcApiClient.getBridgeAT() cubeApiRes: ${JSON.stringify(cubeApiRes)}`);

                const resError = _.get(cubeApiRes, 'error');
                const resData = _.get(cubeApiRes, 'data') as any;
                if (resError === 0) {
                    // 更新本地存储的同步来源网关信息
                    // Update locally stored synchronization source gateway information
                    localSrcGatewayInfo.token = resData.token;
                    localSrcGatewayInfo.tokenValid = true;
                    logger.info(`(service.getGatewayToken) after update localSrcGatewayInfoList: ${JSON.stringify(localSrcGatewayInfoList)}`);
                    await DB.setDbValue('srcGatewayInfoList', localSrcGatewayInfoList);

                    // 通过 SSE 通知前端，网关凭证已经拿到
                    // Notify the front end through SSE that the gateway credentials have been obtained
                    logger.info(`(service.getGatewayToken) SSE.send(): obtain_token_success_report`);
                    SSE.send({
                        name: 'obtain_token_success_report',
                        data: localSrcGatewayInfo
                    });
                    // 拉起sse
                    // Pull up sse
                    await sseUtils.checkForSse();
                    // 更新设备缓存
                    // Update device cache
                    await getSrcGatewayDeviceGroup(reqGatewayMac, true);
                    // 更新目标网关的在线离线状态
                    // Update the online and offline status of the target gateway
                    await sseUtils.setDeviceOnline(localSrcGatewayInfo);

                    return;
                } else {
                    // 通过 SSE 通知前端，网关凭证获取失败
                    // Notify the frontend via SSE that gateway credential acquisition failed
                    logger.info(`(service.getGatewayToken) SSE.send(): obtain_token_fail_report`);
                    SSE.send({
                        name: 'obtain_token_fail_report',
                        data: localSrcGatewayInfo
                    });
                    await srcTokenAndIPInvalid('ip', localSrcGatewayInfo.mac);
                    return;
                }
            } else {
                // 同步来源网关的凭证未失效，直接返回给前端
                // The credentials of the synchronization source gateway have not expired and are returned directly to the front end.
                logger.info(`(service.getGatewayToken) RESPONSE: ERR_SUCCESS`);
                return res.json(toResponse(0, 'Success', localSrcGatewayInfo));
            }
        }

    } catch (error: any) {
        logger.error(`(service.getGatewayToken) error: ${error.message}`);
        if (!hasReturn) {
            return res.json(toResponse(500));
        }
    } finally {
        // if (lockId) {
        // await releaseLock({ lockId, retryCount: 20 });
        // }
    }
}
