import _ from 'lodash';
import { Request, Response } from 'express';
import {
    ERR_CUBEAPI_GET_DEVICE_TIMEOUT,
    ERR_CUBEAPI_GET_DEVICE_TOKEN_INVALID,
    ERR_CUBEAPI_SYNC_DEVICE_PARAMS_INVALID,
    ERR_CUBEAPI_SYNC_DEVICE_TIMEOUT,
    ERR_CUBEAPI_SYNC_DEVICE_TOKEN_INVALID,
    ERR_DEST_GATEWAY_IP_INVALID,
    ERR_DEST_GATEWAY_TOKEN_INVALID,
    ERR_SUCCESS,
    toResponse
} from '../utils/error';
import logger from '../log';
import DB from '../utils/db';
import CubeApi from '../lib/cube-api';
import { GatewayDeviceItem } from '../ts/interface/CubeApi';
import {
    createDeviceTags,
    createDeviceServiceAddr
} from './syncOneDevice';
import { destTokenInvalid } from '../utils/dealError';

/** 同步所有设备(1600) */
export default async function syncAllDevices(req: Request, res: Response) {
    try {

        /** 同步目标网关的信息 */
        const destGatewayInfo = await DB.getDbValue('destGatewayInfo');
        logger.info(`(service.syncAllDevices) destGatewayInfo: ${JSON.stringify(destGatewayInfo)}`);
        if (!destGatewayInfo?.ipValid) {
            logger.info(`(service.syncAllDevice) RESPONSE: ERR_DEST_GATEWAY_IP_INVALID`);
            return res.json(toResponse(ERR_DEST_GATEWAY_IP_INVALID));
        }
        if (!destGatewayInfo?.tokenValid) {
            logger.info(`(service.syncAllDevice) RESPONSE: ERR_DEST_GATEWAY_TOKEN_INVALID`);
            return res.json(toResponse(ERR_DEST_GATEWAY_TOKEN_INVALID));
        }

        /** 同步来源网关的信息列表 */
        const srcGatewayInfoList = await DB.getDbValue('srcGatewayInfoList');
        /** 同步来源网关的信息列表（有效的） */
        const srcGatewayInfoListEffect = [];
        for (const gateway of srcGatewayInfoList) {
            if (gateway.ipValid && gateway.tokenValid) {
                srcGatewayInfoListEffect.push(gateway);
            }
        }

        const ApiClient = CubeApi.ihostApi;
        const destGatewayClient = new ApiClient({ ip: destGatewayInfo.ip, at: destGatewayInfo.token });
        let cubeApiRes = null;
        let destGatewayDeviceList: GatewayDeviceItem[] = [];

        // 拉取同步目标网关的设备
        cubeApiRes = await destGatewayClient.getDeviceList();
        logger.info(`(service.syncAllDevice) destGatewayClient.getDeviceList() cubeApiRes: ${JSON.stringify(cubeApiRes)}`);
        if (cubeApiRes.error === 0) {
            destGatewayDeviceList = cubeApiRes.data.device_list;
        } else if (cubeApiRes.error === 401) {
            await destTokenInvalid();
            logger.info(`(service.syncAllDevice) RESPONSE: ERR_CUBEAPI_GET_DEVICE_TOKEN_INVALID`);
            return res.json(toResponse(ERR_CUBEAPI_GET_DEVICE_TOKEN_INVALID));
        } else {
            logger.info(`(service.syncAllDevice) RESPONSE: ERR_CUBEAPI_GET_DEVICE_TIMEOUT`);
            return res.json(toResponse(ERR_CUBEAPI_GET_DEVICE_TIMEOUT));
        }

        // 拉取所有有效的同步来源设备并汇总
        const syncDevices = [];
        for (const gateway of srcGatewayInfoListEffect) {
            const srcGatewayClient = new ApiClient({ ip: gateway.ip, at: gateway.token });
            // 获取同步来源网关的设备列表
            cubeApiRes = await srcGatewayClient.getDeviceList();
            logger.info(`(service.syncAllDevice) srcGatewayClient.getDeviceList() cubeApiRes: ${JSON.stringify(cubeApiRes)}`);
            // 接口报错不中止流程
            if (cubeApiRes.error === 0) {
                const deviceList = cubeApiRes.data.device_list;
                for (const device of deviceList) {
                    syncDevices.push({
                        name: device.name,
                        third_serial_number: device.serial_number,
                        manufacturer: device.manufacturer,
                        model: device.model,
                        firmware_version: device.firmware_version,
                        display_category: device.display_category,
                        capabilities: device.capabilities,
                        state: device.state,
                        tags: createDeviceTags(device, gateway.mac),
                        service_address: createDeviceServiceAddr(device.serial_number)
                    });
                }
            } else if (cubeApiRes.error === 401) {
                // TODO: token error
            } else {
                // TODO: timeout
            }
        }
        logger.info(`(service.syncAllDevice) syncDevices: ${JSON.stringify(syncDevices)}`);

        // 调用添加第三方设备接口
        cubeApiRes = await destGatewayClient.syncDevices({ devices: syncDevices });
        logger.info(`(service.syncAllDevice) destGatewayClient.syncDevices() cubeApiRes: ${JSON.stringify(cubeApiRes)}`);
        const resError = _.get(res, 'error');
        const resType = _.get(res, 'payload.type');
        if (resError === 1000) {
            logger.info(`(service.syncAllDevice) response: ERR_CUBEAPI_SYNC_DEVICE_TIMEOUT`);
            return res.json(toResponse(ERR_CUBEAPI_SYNC_DEVICE_TIMEOUT));
        } else if (resType === 'AUTH_FAILURE') {
            await destTokenInvalid();
            logger.info(`(service.syncAllDevice) response: ERR_CUBEAPI_SYNC_DEVICE_TOKEN_INVALID`);
            return res.json(toResponse(ERR_CUBEAPI_SYNC_DEVICE_TOKEN_INVALID));
        } else if (resType === 'INVALID_PARAMETERS') {
            logger.info(`(service.syncAllDevice) response: ERR_CUBEAPI_SYNC_DEVICE_PARAMS_INVALID`);
            return res.json(toResponse(ERR_CUBEAPI_SYNC_DEVICE_PARAMS_INVALID));
        } else {
            return res.json(toResponse(ERR_SUCCESS));
        }

    } catch (error: any) {
        logger.error(`(service.syncAllDevice) error: ${error.message}`);
        return res.json(toResponse(500));
    }
}
