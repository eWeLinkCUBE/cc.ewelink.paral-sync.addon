import _ from 'lodash';
import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import DB from '../utils/db';
import CubeApi, { ECategory } from '../lib/cube-api';
import { GatewayDeviceItem } from '../ts/interface/CubeApi';
import CONFIG from '../config';
import { srcDeviceInDestGateway } from './getSourceGatewaySubDevices';
import { destTokenInvalid } from '../utils/dealError';
import { filterUnsupportedCapability, getDestGatewayDeviceGroup, getSrcGatewayDeviceGroup } from '../utils/tmp';
import SSE from '../ts/class/sse';

/**
 * 创建设备的 tags
 * Create device tags
 *
 * @param device 将要同步的设备数据 Device data to be synchronized
 * @param srcGatewayMac 同步来源网关的 MAC 地址 MAC address of sync source gateway
 * @returns 合并后的 tags Merged tags
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
 * Create the service address of the device
 */
export function createDeviceServiceAddr(deviceId: string) {
    return `${CONFIG.localIp}/api/v1/open/device/${deviceId}`;
}

/**
 * 同步单个设备(1500) 
 * Sync a single device (1500)
 * */
export default async function syncOneDevice(req: Request, res: Response) {
    try {
        /** 
        * 将要被同步的设备 ID
        * Device ID to be synced
        */
        const willSyncDeviceId = req.params.deviceId;
        /** 
        * 同步来源网关的 MAC 地址
        * MAC address of sync source gateway
        */
        const srcGatewayMac = req.body.from;
        logger.info(`(service.syncOneDevice) willSyncDeviceId: ${willSyncDeviceId}`);
        logger.info(`(service.syncOneDevice) srcGatewayMac: ${srcGatewayMac}`);

        /** 
        * 同步目标网关的信息
        * Synchronize target gateway information
        */
        const destGatewayInfo = await DB.getDbValue('destGatewayInfo');
        if (!destGatewayInfo?.ipValid) {
            logger.info(`(service.syncOneDevice) RESPONSE: ERR_DEST_GATEWAY_IP_INVALID`);
            return res.json(toResponse(702));
        }
        if (!destGatewayInfo?.tokenValid) {
            logger.info(`(service.syncOneDevice) RESPONSE: ERR_DEST_GATEWAY_TOKEN_INVALID`);
            return res.json(toResponse(703));
        }

        /** 
        * 同步来源网关的信息列表
        * Synchronization source gateway information list
        */
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

        const srcRes = await getSrcGatewayDeviceGroup(srcGatewayMac);
        logger.debug(`(service.syncOneDevice) srcRes: ${JSON.stringify(srcRes)}`);
        if (srcRes.error === 0) {
            srcGatewayDeviceList = srcRes.data.device_list;
        } else {
            return res.json(toResponse(srcRes.error));
        }

        const destRes = await getDestGatewayDeviceGroup();
        logger.debug(`(service.syncOneDevice) destRes: ${JSON.stringify(destRes)}`);
        if (destRes.error === 0) {
            destGatewayDeviceList = destRes.data.device_list;
        } else {
            return res.json(toResponse(destRes.error));
        }

        /** 
        * 将要被同步的设备数据
        * Device data to be synchronized
        */
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
            // 当前设备已经被同步过了 The current device has been synchronized
            SSE.send({
                name: 'sync_one_device_result',
                data: {
                    syncDeviceId: srcDeviceData.serial_number
                }
            });
            return;
        } else {
            logger.debug(`(service.syncOneDevice) before formatted device: ${JSON.stringify(srcDeviceData)}`);
            // 删除不支持的能力 filter unsupported capability
            const formattedDevice = filterUnsupportedCapability(srcDeviceData);
            // 调用添加第三方设备的接口 Call the interface for adding third-party devices
            const syncDevices = [
                {
                    name: formattedDevice.name,
                    third_serial_number: formattedDevice.serial_number,
                    manufacturer: formattedDevice.manufacturer,
                    model: formattedDevice.model,
                    firmware_version: formattedDevice.firmware_version,
                    display_category: formattedDevice.display_category as ECategory,
                    capabilities: formattedDevice.capabilities,
                    state: formattedDevice.state,
                    tags: createDeviceTags(formattedDevice, srcGatewayMac),
                    service_address: createDeviceServiceAddr(willSyncDeviceId),
                },
            ];
            logger.info(`(service.syncOneDevice) syncDevices: ${JSON.stringify(syncDevices)}`);
            cubeApiRes = await destGatewayClient.syncDevices({ devices: syncDevices });
            logger.debug(`(service.syncOneDevice) destGatewayClient.syncDevices() cubeApiRes: ${JSON.stringify(cubeApiRes)}`);
            const resError = _.get(cubeApiRes, 'error');
            const resType = _.get(cubeApiRes, 'payload.type');
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
            } else if (resType === 'INTERNAL_ERROR') {
                logger.info(`(service.syncOneDevice) response: ERR_CUBEAPI_SYNC_DEVICE_INTERNAL_ERROR`);
                return res.json(toResponse(500));
            } else {
                logger.info(`(service.syncOneDevice) RESPONSE: ERR_SUCCESS`);
                res.json(toResponse(0));
                // 同步成功，把结果通过 SSE 告诉前端 sync success, inform frontend
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
