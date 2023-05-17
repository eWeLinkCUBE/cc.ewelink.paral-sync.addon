import _ from 'lodash';
import { Request, Response } from 'express';
import {
    toResponse,
    ERR_NO_DEST_GATEWAY_MAC,
    ERR_INTERNAL_ERROR,
    ERR_NO_DEST_GATEWAY_INFO,
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

/**
 * 创建设备的 tags
 *
 * @param device 将要同步的设备数据
 * @param srcGatewayMac 同步来源网关的 MAC 地址
 * @returns 合并后的 tags
 */
function createDeviceTags(device: GatewayDeviceItem, srcGatewayMac: string) {
    let result = {};
    if (device.tags) {
        result = { ...device.tags };
    }
    const additionalData = {
        srcGatewayMac
    };
    _.set(result, '__nsproAddonData', additionalData);
    return result;
}

/**
 * 创建设备的 service address
 */
function createDeviceServiceAddr() {
    // TODO: fix this address
    return 'http://'
}

/** 同步单个设备(1500) */
export default async function syncOneDevice(req: Request, res: Response) {
    try {
        /** 将要同步的设备 ID */
        const willSyncDeviceId = req.params.deviceId;
        /** 同步来源网关的 MAC 地址 */
        const srcGatewayMac = req.params.from;
        /** 同步目标网关的 MAC 地址 */
        const destGatewayMac = await DB.getDbValue('destGatewayMac');
        /** 本地存储的网关信息列表 */
        const gatewayInfoList = await DB.getDbValue('gatewayInfoList');

        logger.info(`(service.syncOneDevice) willSyncDeviceId: ${willSyncDeviceId}`);
        logger.info(`(service.syncOneDevice) srcGatewayMac: ${srcGatewayMac}`);
        logger.info(`(service.syncOneDevice) destGatewayMac: ${destGatewayMac}`);
        logger.info(`(service.syncOneDevice) gatewayInfoList: ${JSON.stringify(gatewayInfoList)}`);

        if (!destGatewayMac) {
            logger.info(`(service.syncOneDevice) response: ERR_NO_DEST_GATEWAY_MAC`);
            return res.json(toResponse(ERR_NO_DEST_GATEWAY_MAC));
        }

        /** 同步目标网关的信息 */
        const destGatewayInfo = _.find(gatewayInfoList, { mac: destGatewayMac });
        if (!destGatewayInfo) {
            logger.info(`(service.syncOneDevice) response: ERR_NO_DEST_GATEWAY_INFO`);
            return res.json(toResponse(ERR_NO_DEST_GATEWAY_INFO));
        }
        if (!destGatewayInfo.ipValid) {
            logger.info(`(service.syncOneDevice) response: ERR_DEST_GATEWAY_IP_INVALID`);
            return res.json(toResponse(ERR_DEST_GATEWAY_IP_INVALID));
        }
        if (!destGatewayInfo.tokenValid) {
            logger.info(`(service.syncOneDevice) response: ERR_DEST_GATEWAY_TOKEN_INVALID`);
            return res.json(toResponse(ERR_DEST_GATEWAY_TOKEN_INVALID));
        }

        /** 同步来源网关的信息 */
        const srcGatewayInfo = _.find(gatewayInfoList, { mac: srcGatewayMac });
        if (!srcGatewayInfo) {
            logger.info(`(service.syncOneDevice) response: ERR_NO_SRC_GATEWAY_INFO`);
            return res.json(toResponse(ERR_NO_SRC_GATEWAY_INFO));
        }
        if (!srcGatewayInfo.ipValid) {
            logger.info(`(service.syncOneDevice) response: ERR_SRC_GATEWAY_IP_INVALID`);
            return res.json(toResponse(ERR_SRC_GATEWAY_IP_INVALID));
        }
        if (!srcGatewayInfo.tokenValid) {
            logger.info(`(service.syncOneDevice) response: ERR_SRC_GATEWAY_TOKEN_INVALID`);
            return res.json(toResponse(ERR_SRC_GATEWAY_TOKEN_INVALID));
        }

        const ApiClient = CubeApi.ihostApi;
        /** 同步来源网关的 eWeLink Cube API client */
        const srcGatewayApiClient = new ApiClient({ ip: srcGatewayInfo.ip, at: srcGatewayInfo.token });
        /** 同步目标网关的 eWeLink Cube API client */
        const destGatewayApiClient = new ApiClient({ ip: destGatewayInfo.ip, at: destGatewayInfo.token });
        let cubeApiRes = null;
        cubeApiRes = await srcGatewayApiClient.getDeviceList();
        logger.info(`(service.syncOneDevice) srcGatewayApiClient.getDeviceList() res: ${JSON.stringify(cubeApiRes)}`);
        if (cubeApiRes.error === 0) {
            /** 同步来源网关的设备列表 */
            const srcGatewayDeviceList = cubeApiRes.data.device_list as GatewayDeviceItem[];
            /** 本地存储的所有网关设备列表 */
            const localDeviceList = await DB.getDbValue('gatewayDeviceList');
            logger.info(`(service.syncOneDevice) localDeviceList: ${JSON.stringify(localDeviceList)}`);

            /** 将要同步的设备数据 */
            const willSyncDeviceData = _.find(srcGatewayDeviceList, { serial_number: willSyncDeviceId }) as GatewayDeviceItem;
            // 如果将要同步的设备不在同步来源网关中，报错
            if (!willSyncDeviceData) {
                logger.info(`(service.syncOneDevice) response: ERR_SYNC_DEVICE_NOT_IN_SRC_GATEWAY`);
                return res.json(toResponse(ERR_SYNC_DEVICE_NOT_IN_SRC_GATEWAY));
            }

            // 更新本地存储的网关设备列表
            const localDeviceListUpdate = [];
            for (const device of localDeviceList) {
                const deviceInSrcGateway = _.find(srcGatewayDeviceList, { serial_number: device.id });
                const deviceFromSrcGateway = device.from === srcGatewayMac;
                if (deviceFromSrcGateway && !deviceInSrcGateway) {
                    // 设备已不在来源网关设备列表中，删除它
                    cubeApiRes = await srcGatewayApiClient.deleteDevice(willSyncDeviceId);
                    logger.info(`(service.syncOneDevice) srcGatewayApiClient.deleteDevice() res: ${JSON.stringify(cubeApiRes)}`);
                } else {
                    localDeviceListUpdate.push(device);
                }
            }
            for (const device of srcGatewayDeviceList) {
                const deviceInLocalList = _.find(localDeviceListUpdate, { id: device.serial_number, from: srcGatewayMac });
                if (!deviceInLocalList) {
                    // 如果设备不在本地存储中，添加它
                    localDeviceListUpdate.push({
                        name: device.name,
                        id: device.serial_number,
                        from: srcGatewayMac,
                        isSynced: false
                    });
                }
            }

            // 调用添加第三方设备接口
            const syncDevices = [
                {
                    name: willSyncDeviceData.name,
                    third_serial_number: willSyncDeviceData.serial_number,
                    manufacturer: willSyncDeviceData.manufacturer,
                    model: willSyncDeviceData.model,
                    firmware_version: willSyncDeviceData.firmware_version,
                    display_category: willSyncDeviceData.display_category as any,
                    capabilities: willSyncDeviceData.capabilities,
                    state: willSyncDeviceData.state,
                    tags: createDeviceTags(willSyncDeviceData, srcGatewayMac),
                    service_address: createDeviceServiceAddr()
                }
            ];
            logger.info(`(service.syncOneDevice) syncDevices: ${JSON.stringify(syncDevices)}`);
            cubeApiRes = await destGatewayApiClient.syncDevices({ devices: syncDevices });
            logger.info(`(service.syncOneDevice) destGatewayApiClient.syncDevices() res: ${JSON.stringify(cubeApiRes)}`);
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
                const i = _.findIndex(localDeviceList, { id: willSyncDeviceId, from: srcGatewayMac });
                logger.info(`(service.syncOneDevice) final device index: ${i}`);
                if (i === -1) {
                    return res.json(toResponse(ERR_INTERNAL_ERROR));
                }
                localDeviceListUpdate[i].isSynced = true;
                // 同步成功，更新本地存储的设备列表数据
                // TODO: acquire lock
                await DB.setDbValue('gatewayDeviceList', localDeviceListUpdate);
                logger.info(`(service.syncOneDevice) response: ERR_SUCCESS`);
                return res.json(toResponse(ERR_SUCCESS));
            }
        } else if (cubeApiRes.error === 401) {
            logger.info(`(service.syncOneDevice) response: ERR_CUBEAPI_GET_DEVICE_TOKEN_INVALID`);
            return res.json(toResponse(ERR_CUBEAPI_GET_DEVICE_TOKEN_INVALID));
        } else {
            logger.info(`(service.syncOneDevice) response: ERR_CUBEAPI_GET_DEVICE_TIMEOUT`);
            return res.json(toResponse(ERR_CUBEAPI_GET_DEVICE_TIMEOUT));
        }
    } catch (error: any) {
        logger.error(`get iHost token code error----------------: ${error.message}`);
        res.json(toResponse(ERR_INTERNAL_ERROR));
    }
}
