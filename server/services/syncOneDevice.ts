import _ from 'lodash';
import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import DB from '../utils/db';
import CubeApi from '../lib/cube-api';
import { GatewayDeviceItem } from '../ts/interface/CubeApi';
import CONFIG from '../config';
import { srcDeviceInDestGateway } from './getSourceGatewaySubDevices';
import { destTokenInvalid, srcTokenAndIPInvalid } from '../utils/dealError';
import { getDestGatewayDeviceGroup, getSrcGatewayDeviceGroup, updateSrcGatewayDeviceGroup } from '../utils/tmp';
import SSE from '../ts/class/sse';

/**
 * 创建设备的 tags
 *
 * @param device 将要同步的设备数据
 * @param srcGatewayMac 同步来源网关的 MAC 地址
 * @returns 合并后的 tags
 */
export function createDeviceTags(device: any, srcGatewayMac: string) {
    let result = {};
    if (device.tags) {
        result = { ...device.tags };
    }
    const additionalData = {
        srcGatewayMac,
        deviceId: device.serial_number,
    };
    _.set(result, '__nsproAddonData', additionalData);
    return result;
}

/**
 * 创建设备的 service address
 */
export function createDeviceServiceAddr(deviceId: string) {
    return `${CONFIG.localIp}/api/v1/open/device/${deviceId}`;
}

/** 同步单个设备(1500) */
export default async function syncOneDevice(req: Request, res: Response) {
    try {
        /** 将要被同步的设备 ID */
        const willSyncDeviceId = req.params.deviceId;
        /** 同步来源网关的 MAC 地址 */
        const srcGatewayMac = req.body.from;
        logger.info(`(service.syncOneDevice) willSyncDeviceId: ${willSyncDeviceId}`);
        logger.info(`(service.syncOneDevice) srcGatewayMac: ${srcGatewayMac}`);

        /** 同步目标网关的信息 */
        const destGatewayInfo = await DB.getDbValue('destGatewayInfo');
        if (!destGatewayInfo?.ipValid) {
            logger.info(`(service.syncOneDevice) RESPONSE: ERR_DEST_GATEWAY_IP_INVALID`);
            return res.json(toResponse(702));
        }
        if (!destGatewayInfo?.tokenValid) {
            logger.info(`(service.syncOneDevice) RESPONSE: ERR_DEST_GATEWAY_TOKEN_INVALID`);
            return res.json(toResponse(703));
        }

        /** 同步来源网关的信息列表 */
        const srcGatewayInfoList = await DB.getDbValue('srcGatewayInfoList');
        const srcGatewayInfo = _.find(srcGatewayInfoList, { mac: srcGatewayMac });
        if (!srcGatewayInfo) {
            logger.info(`(service.syncOneDevice) RESPONSE: ERR_NO_SRC_GATEWAY_INFO`);
            return res.json(toResponse(1500));
        }
        if (!srcGatewayInfo.ipValid) {
            logger.info(`(service.syncOneDevice) RESPONSE: ERR_SRC_GATEWAY_IP_INVALID`);
            return res.json(toResponse(1501));
        }
        if (!srcGatewayInfo.tokenValid) {
            logger.info(`(service.syncOneDevice) RESPONSE: ERR_SRC_GATEWAY_TOKEN_INVALID`);
            return res.json(toResponse(1502));
        }

        const ApiClient = CubeApi.ihostApi;
        const destGatewayClient = new ApiClient({ ip: destGatewayInfo.ip, at: destGatewayInfo.token });
        let cubeApiRes = null;
        let srcGatewayDeviceList: GatewayDeviceItem[] = [];
        let destGatewayDeviceList: GatewayDeviceItem[] = [];

        // 获取同步来源网关的设备列表
        const srcRes = await getSrcGatewayDeviceGroup(srcGatewayMac);
        logger.debug(`(service.syncOneDevice) srcRes: ${JSON.stringify(srcRes)}`);
        if (srcRes.error === 0) {
            srcGatewayDeviceList = srcRes.data.device_list;
        } else {
            return res.json(toResponse(srcRes.error));
        }

        // 获取同步目标网关的设备列表
        const destRes = await getDestGatewayDeviceGroup();
        logger.debug(`(service.syncOneDevice) destRes: ${JSON.stringify(destRes)}`);
        if (destRes.error === 0) {
            destGatewayDeviceList = destRes.data.device_list;
        } else {
            return res.json(toResponse(destRes.error));
        }

        /** 将要被同步的设备数据 */
        const srcDeviceData = _.find(srcGatewayDeviceList, { serial_number: willSyncDeviceId });
        logger.debug(`(service.syncOneDevice) srcDeviceData: ${JSON.stringify(srcDeviceData)}`);
        if (!srcDeviceData) {
            logger.info(`(service.syncOneDevice) RESPONSE: ERR_SYNC_DEVICE_NOT_IN_SRC_GATEWAY`);
            return res.json(toResponse(1503));
        }

        if (srcDeviceInDestGateway(srcDeviceData.serial_number, destGatewayDeviceList)) {
            logger.info(`(service.syncOneDevice)  current device ${srcDeviceData} already exist in dest gateway`)
            logger.debug(`(service.syncOneDevice)  current device ${srcDeviceData}, destGatewayDeviceList => ${JSON.stringify(destGatewayDeviceList)}`)
            res.json(toResponse(0));
            // 当前设备已经被同步过了
            SSE.send({
                name: 'sync_one_device_result',
                data: {
                    syncDeviceId: srcDeviceData.serial_number
                }
            });
            return;
        } else {
            // 调用添加第三方设备的接口
            const syncDevices = [
                {
                    name: srcDeviceData.name,
                    third_serial_number: srcDeviceData.serial_number,
                    manufacturer: srcDeviceData.manufacturer,
                    model: srcDeviceData.model,
                    firmware_version: srcDeviceData.firmware_version,
                    display_category: srcDeviceData.display_category as any,
                    capabilities: srcDeviceData.capabilities,
                    state: srcDeviceData.state,
                    tags: createDeviceTags(srcDeviceData, srcGatewayMac),
                    service_address: createDeviceServiceAddr(willSyncDeviceId),
                },
            ];
            logger.info(`(service.syncOneDevice) syncDevices: ${JSON.stringify(syncDevices)}`);
            cubeApiRes = await destGatewayClient.syncDevices({ devices: syncDevices });
            logger.debug(`(service.syncOneDevice) destGatewayClient.syncDevices() cubeApiRes: ${JSON.stringify(cubeApiRes)}`);
            const resError = _.get(res, 'error');
            const resType = _.get(res, 'payload.type');
            if (resError === 1000) {
                logger.info(`(service.syncOneDevice) response: ERR_CUBEAPI_SYNC_DEVICE_TIMEOUT`);
                return res.json(toResponse(603));
            } else if (resType === 'AUTH_FAILURE') {
                await destTokenInvalid();
                logger.info(`(service.syncOneDevice) response: ERR_CUBEAPI_SYNC_DEVICE_TOKEN_INVALID`);
                return res.json(toResponse(605));
            } else if (resType === 'INVALID_PARAMETERS') {
                logger.info(`(service.syncOneDevice) response: ERR_CUBEAPI_SYNC_DEVICE_PARAMS_INVALID`);
                return res.json(toResponse(604));
            } else {
                logger.info(`(service.syncOneDevice) RESPONSE: ERR_SUCCESS`);
                res.json(toResponse(0));
                // 同步成功，把结果通过 SSE 告诉前端
                SSE.send({
                    name: 'sync_one_device_result',
                    data: {
                        syncDeviceId: srcDeviceData.serial_number
                    }
                });
                return;
            }
        }
    } catch (error: any) {
        logger.error(`(service.syncOneDevice) error: ${error.message}`);
        return res.json(toResponse(500));
    }
}
