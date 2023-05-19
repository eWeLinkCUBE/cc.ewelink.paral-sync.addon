import _ from 'lodash';
import { Request, Response } from 'express';
import {
    toResponse,
    ERR_INTERNAL_ERROR,
    ERR_DEST_GATEWAY_IP_INVALID,
    ERR_DEST_GATEWAY_TOKEN_INVALID,
    ERR_NO_SRC_GATEWAY_INFO,
    ERR_SRC_GATEWAY_TOKEN_INVALID,
    ERR_SRC_GATEWAY_IP_INVALID,
    ERR_CUBEAPI_GET_DEVICE_TOKEN_INVALID,
    ERR_CUBEAPI_GET_DEVICE_TIMEOUT,
    ERR_SYNC_DEVICE_NOT_IN_SRC_GATEWAY,
    ERR_CUBEAPI_SYNC_DEVICE_TIMEOUT,
    ERR_CUBEAPI_SYNC_DEVICE_TOKEN_INVALID,
    ERR_CUBEAPI_SYNC_DEVICE_PARAMS_INVALID,
    ERR_SUCCESS
} from '../utils/error';
import logger from '../log';
import DB from '../utils/db';
import CubeApi from '../lib/cube-api';
import { GatewayDeviceItem } from '../ts/interface/CubeApi';
import CONFIG from '../config';
import { srcDeviceInDestGateway } from './getSourceGatewaySubDevices';

/**
 * 创建设备的 tags
 *
 * @param device 将要同步的设备数据
 * @param srcGatewayMac 同步来源网关的 MAC 地址
 * @returns 合并后的 tags
 */
export function createDeviceTags(device: GatewayDeviceItem, srcGatewayMac: string) {
    let result = {};
    if (device.tags) {
        result = { ...device.tags };
    }
    const additionalData = {
        srcGatewayMac,
        deviceId: device.serial_number
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
        const srcGatewayMac = req.params.from;
        logger.info(`(service.syncOneDevice) willSyncDeviceId: ${willSyncDeviceId}`);
        logger.info(`(service.syncOneDevice) srcGatewayMac: ${srcGatewayMac}`);

        /** 同步目标网关的信息 */
        const destGatewayInfo = await DB.getDbValue('destGatewayInfo');
        if (!destGatewayInfo?.ipValid) {
            logger.info(`(service.syncOneDevice) RESPONSE: ERR_DEST_GATEWAY_IP_INVALID`);
            return res.json(toResponse(ERR_DEST_GATEWAY_IP_INVALID));
        }
        if (!destGatewayInfo?.tokenValid) {
            logger.info(`(service.syncOneDevice) RESPONSE: ERR_DEST_GATEWAY_TOKEN_INVALID`);
            return res.json(toResponse(ERR_DEST_GATEWAY_TOKEN_INVALID));
        }

        /** 同步来源网关的信息列表 */
        const srcGatewayInfoList = await DB.getDbValue('srcGatewayInfoList');
        const srcGatewayInfo = _.find(srcGatewayInfoList, { mac: srcGatewayMac });
        if (!srcGatewayInfo) {
            logger.info(`(service.syncOneDevice) RESPONSE: ERR_NO_SRC_GATEWAY_INFO`);
            return res.json(toResponse(ERR_NO_SRC_GATEWAY_INFO));
        }
        if (!srcGatewayInfo.ipValid) {
            logger.info(`(service.syncOneDevice) RESPONSE: ERR_SRC_GATEWAY_IP_INVALID`);
            return res.json(toResponse(ERR_SRC_GATEWAY_IP_INVALID));
        }
        if (!srcGatewayInfo.tokenValid) {
            logger.info(`(service.syncOneDevice) RESPONSE: ERR_SRC_GATEWAY_TOKEN_INVALID`);
            return res.json(toResponse(ERR_SRC_GATEWAY_TOKEN_INVALID));
        }

        const ApiClient = CubeApi.ihostApi;
        const srcGatewayClient = new ApiClient({ ip: srcGatewayInfo.ip, at: srcGatewayInfo.token });
        const destGatewayClient = new ApiClient({ ip: destGatewayInfo.ip, at: destGatewayInfo.token });
        let cubeApiRes = null;
        let srcGatewayDeviceList: GatewayDeviceItem[] = [];
        let destGatewayDeviceList: GatewayDeviceItem[] = [];

        // 获取同步来源网关的设备列表
        cubeApiRes = await srcGatewayClient.getDeviceList();
        logger.info(`(service.getSourceGatewaySubDevices) srcGatewayClient.getDeviceList() cubeApiRes: ${JSON.stringify(cubeApiRes)}`);
        if (cubeApiRes.error === 0) {
            srcGatewayDeviceList = cubeApiRes.data.device_list;
        } else if (cubeApiRes.error === 401) {
            logger.info(`(service.getSourceGatewaySubDevices) RESPONSE: ERR_CUBEAPI_GET_DEVICE_TOKEN_INVALID`);
            return res.json(toResponse(ERR_CUBEAPI_GET_DEVICE_TOKEN_INVALID));
        } else {
            logger.info(`(service.getSourceGatewaySubDevices) RESPONSE: ERR_CUBEAPI_GET_DEVICE_TIMEOUT`);
            return res.json(toResponse(ERR_CUBEAPI_GET_DEVICE_TIMEOUT));
        }

        // 获取同步目标网关的设备列表
        cubeApiRes = await destGatewayClient.getDeviceList();
        logger.info(`(service.getSourceGatewaySubDevices) destGatewayClient.getDeviceList() cubeApiRes: ${JSON.stringify(cubeApiRes)}`);
        if (cubeApiRes.error === 0) {
            destGatewayDeviceList = cubeApiRes.data.device_list;
        } else if (cubeApiRes.error === 401) {
            logger.info(`(service.getSourceGatewaySubDevices) RESPONSE: ERR_CUBEAPI_GET_DEVICE_TOKEN_INVALID`);
            return res.json(toResponse(ERR_CUBEAPI_GET_DEVICE_TOKEN_INVALID));
        } else {
            logger.info(`(service.getSourceGatewaySubDevices) RESPONSE: ERR_CUBEAPI_GET_DEVICE_TIMEOUT`);
            return res.json(toResponse(ERR_CUBEAPI_GET_DEVICE_TIMEOUT));
        }

        /** 将要被同步的设备数据 */
        const srcDeviceData = _.find(srcGatewayDeviceList, { serial_number: willSyncDeviceId });
        logger.info(`(service.syncOneDevice) srcDeviceData: ${JSON.stringify(srcDeviceData)}`);
        if (!srcDeviceData) {
            logger.info(`(service.syncOneDevice) RESPONSE: ERR_SYNC_DEVICE_NOT_IN_SRC_GATEWAY`);
            return res.json(toResponse(ERR_SYNC_DEVICE_NOT_IN_SRC_GATEWAY));
        }

        if (srcDeviceInDestGateway(srcDeviceData.serial_number, destGatewayDeviceList)) {
            // 当前设备已经被同步过了
            return res.json(toResponse(ERR_SUCCESS));
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
                    service_address: createDeviceServiceAddr(willSyncDeviceId)
                }
            ];
            logger.info(`(service.syncOneDevice) syncDevices: ${JSON.stringify(syncDevices)}`);
            cubeApiRes = await destGatewayClient.syncDevices({ devices: syncDevices });
            logger.info(`(service.syncOneDevice) destGatewayClient.syncDevices() cubeApiRes: ${JSON.stringify(cubeApiRes)}`);
            const resError = _.get(res, 'error');
            const resType = _.get(res, 'payload.type');
            if (resError === 1000) {
                logger.info(`(service.syncOneDevice) response: ERR_CUBEAPI_SYNC_DEVICE_TIMEOUT`);
                return res.json(toResponse(ERR_CUBEAPI_SYNC_DEVICE_TIMEOUT));
            } else if (resType === 'AUTH_FAILURE') {
                logger.info(`(service.syncOneDevice) response: ERR_CUBEAPI_SYNC_DEVICE_TOKEN_INVALID`);
                return res.json(toResponse(ERR_CUBEAPI_SYNC_DEVICE_TOKEN_INVALID));
            } else if (resType === 'INVALID_PARAMETERS') {
                logger.info(`(service.syncOneDevice) response: ERR_CUBEAPI_SYNC_DEVICE_PARAMS_INVALID`);
                return res.json(toResponse(ERR_CUBEAPI_SYNC_DEVICE_PARAMS_INVALID));
            } else {
                return res.json(toResponse(ERR_SUCCESS));
            }
        }

    } catch (error: any) {
        logger.error(`get iHost token code error----------------: ${error.message}`);
        res.json(toResponse(ERR_INTERNAL_ERROR));
    }
}
