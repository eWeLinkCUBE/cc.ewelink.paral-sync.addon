import _ from 'lodash';
import db from "./db"
import logger from '../log';
import { GatewayDeviceItem } from '../ts/interface/CubeApi';
import IResponse from '../lib/cube-api/ts/interface/IResponse';
import CubeApi from '../lib/cube-api';
import { ESseStatus } from '../ts/class/srcSse';
import { srcSsePool } from './tmp';

/**
 * @description 将所有网关相关设备下线
 * @param {string} mac
 * @returns {*}  {Promise<void>}
 */
async function _allRelevantDeviceOffline(mac: string): Promise<void> {
    logger.info(`[dealWith Token Invalid] _allRelevantDeviceOffline srcMac: ${mac}`);
    /** 同步目标网关的 MAC 地址 */
    const destGatewayInfo = await db.getDbValue('destGatewayInfo');
    if (!destGatewayInfo) {
        logger.info(`[dealWith Token Invalid] target gateway missing`);
        return;
    }
    if (!destGatewayInfo.ipValid) {
        logger.info(`[dealWith Token Invalid] target gateway ip invalid`);
        return;
    }
    if (!destGatewayInfo.tokenValid) {
        logger.info(`[dealWith Token Invalid] target gateway token invalid`);
        return;
    }

    /** 目标网关的 eWeLink Cube API client */
    let destGatewayDeviceList: GatewayDeviceItem[] = [];
    const ApiClient = CubeApi.ihostApi;
    const destGatewayApiClient = new ApiClient({ ip: destGatewayInfo.ip, at: destGatewayInfo.token });
    let cubeApiRes = await destGatewayApiClient.getDeviceList();
    logger.info(`[dealWith Token Invalid] destGatewayClient.getDeviceList() cubeApiRes: ${JSON.stringify(cubeApiRes)}`);
    if (cubeApiRes.error === 0) {
        destGatewayDeviceList = cubeApiRes.data.device_list;
    } else if (cubeApiRes.error === 401) {
        logger.info(`[dealWith Token Invalid] get src device list token invalid`);
        return;
    } else {
        logger.info(`[dealWith Token Invalid] get src device list timeout`);
        return;
    }

    // 遍历目标网关中的设备并离线
    const promiseList: Promise<IResponse>[] = [];
    for (const device of destGatewayDeviceList) {
        const nsProAddonData = _.get(device, ["tags", "__nsproAddonData"]);
        if (!nsProAddonData) continue;
        const { srcGatewayMac, deviceId } = nsProAddonData;
        if (srcGatewayMac === mac) {
            promiseList.push(destGatewayApiClient.updateDeviceOnline({
                serial_number: device.serial_number,
                third_serial_number: deviceId,
                params: {
                    online: false
                }
            }));
        }
    }

    const deleteResList = await Promise.all(promiseList);
    for (const res of deleteResList) {
        if (res.error === 0) {
            logger.info(`[dealWith Token Invalid] device offline success`);
        } else if (res.error === 401) {
            logger.info(`[dealWith Token Invalid] device offline token invalid`);
            return;
        } else {
            logger.info(`[dealWith Token Invalid] device offline timeout`);
            return;
        }
    }
}



/**
 * @description 处理接口端的所有超时与token失效错误
 * @param {("token" | "ip")} type
 * @param {string} srcMac 目标网关mac
 * @returns {*}  {Promise<void>}
 */
export async function srcTokenAndIPInvalid(type: "token" | "ip", srcMac: string): Promise<void> {
    try {
        logger.info(`[dealWith Token Invalid] srcTokenAndIPInvalid type: ${type} srcMac: ${srcMac}`);
        const key = type === 'token' ? "tokenValid" : "ipValid";
        const destGatewayInfo = await db.getDbValue('destGatewayInfo');
        const srcGatewayInfoList = await db.getDbValue('srcGatewayInfoList');
        const sse = srcSsePool.get(srcMac);

        if (!destGatewayInfo) {
            logger.warn(`[dealWith Token Invalid] error : ERR_NO_DEST_GATEWAY_INFO`);
            return;
        }

        if (!sse) {
            logger.warn(`[dealWith Token Invalid] error : src ${srcMac} sse doesn't exist!`);
            return;
        }

        // 查询目标网关中是否存在该mac地址对应网关
        if (srcMac === destGatewayInfo.mac) {
            if (destGatewayInfo[key] === false) {
                logger.info(`[dealWith Token Invalid] error : src ${srcMac}'s ${key} already false`);
                return;
            };
            // 因为 NSPro 凭证失效后，SSE 连接不断开，等 NSPro 后续修复这个问题
            // if (sse.status === ESseStatus.OPEN) {
            //     logger.error(`[dealWith Token Invalid] error : src ${srcMac}'s SSE still open`);
            //     return;
            // };
            destGatewayInfo[key] = false;
            _allRelevantDeviceOffline(srcMac);
            await db.setDbValue('destGatewayInfo', destGatewayInfo);
            return;
        }

        // 查询来源网关中是否存在该mac地址对应网关
        srcGatewayInfoList.forEach(gateway => {
            if (gateway.mac === srcMac) {
                if (gateway[key] === false) {
                    logger.error(`[dealWith Token Invalid] error : src ${srcMac}'s ${key} already false`);
                    return;
                }
                // 因为 NSPro 凭证失效后，SSE 连接不断开，等 NSPro 后续修复这个问题
                // if (sse.status === ESseStatus.OPEN) {
                //     logger.error(`[dealWith Token Invalid] error : src ${srcMac}'s SSE still open`);
                //     return;
                // };
                _allRelevantDeviceOffline(srcMac);
                gateway[key] = false;
            }
        })

        await db.setDbValue('srcGatewayInfoList', srcGatewayInfoList);
    } catch (err) {
        logger.error("dealWithTokenInvalid err: ", err);
    }
}



/**
 * @description 将目标网关token设为无效
 * @export
 * @returns {*}  {Promise<void>}
 */
export async function destTokenInvalid(): Promise<void> {
    try {
        logger.info(`[dealWith Token Invalid] destTokenInvalid`);
        const destGatewayInfo = await db.getDbValue('destGatewayInfo');
        if (!destGatewayInfo) {
            logger.error(`[dealWith Token Invalid] error : ERR_NO_DEST_GATEWAY_INFO`);
            return;
        }

        if (!destGatewayInfo.tokenValid) return;

        destGatewayInfo.tokenValid = false;
        destGatewayInfo.token = "";
        await db.setDbValue('destGatewayInfo', destGatewayInfo);
    } catch (err) {
        logger.error("destTokenInvalid err: ", err);
    }
}
