import _ from 'lodash';
import { Request, Response } from 'express';
import logger from '../log';
import DB from '../utils/db';
import CubeApi from '../lib/cube-api';
import {
    ERR_CUBEAPI_DELETE_DEVICE_NOT_FOUND,
    ERR_CUBEAPI_DELETE_DEVICE_TIMEOUT,
    ERR_CUBEAPI_DELETE_DEVICE_TOKEN_INVALID,
    ERR_CUBEAPI_GET_DEVICE_TIMEOUT,
    ERR_CUBEAPI_GET_DEVICE_TOKEN_INVALID,
    ERR_DEST_GATEWAY_IP_INVALID,
    ERR_DEST_GATEWAY_TOKEN_INVALID,
    ERR_INTERNAL_ERROR,
    ERR_SUCCESS,
    ERR_UNSYNC_DEVICE_NOT_FOUND,
    toResponse
} from '../utils/error';
import { GatewayDeviceItem } from '../ts/interface/CubeApi';

/**
 * 从同步目标网关中返回符合条件的设备数据，如果没找到则返回 null
 *
 * @param deviceId 同步设备的 ID
 * @param srcGatewayMac 同步来源网关 MAC 地址
 * @param destGatewayDeviceList 同步目标网关的设备列表
 */
function findDeviceInDestGateway(deviceId: string, srcGatewayMac: string, destGatewayDeviceList: GatewayDeviceItem[]) {
    for (const device of destGatewayDeviceList) {
        const id = _.get(device, 'tags.__nsproAddonData.deviceId');
        const mac = _.get(device, 'tags.__nsproAddonData.srcGatewayMac');
        if (id === deviceId && mac === srcGatewayMac) {
            return device;
        }
    }
    return null;
}

/** 取消同步单个设备（1800） */
export default async function unsyncOneDevice(req: Request, res: Response) {
    try {
        /** 将要被取消同步的设备 ID */
        const willUnsyncDeviceId = req.params.deviceId;
        /** 被取消同步设备的来源网关 */
        const reqSrcGatewayMac = req.body.from;

        logger.info(`(service.unsyncOneDevice) willUnsyncDeviceId: ${willUnsyncDeviceId}`);
        logger.info(`(service.unsyncOneDevice) reqSrcGatewayMac: ${reqSrcGatewayMac}`);

        /** 同步目标网关的信息 */
        const destGatewayInfo = await DB.getDbValue('destGatewayInfo');
        logger.info(`(service.unsyncOneDevice) destGatewayInfo: ${JSON.stringify(destGatewayInfo)}`);
        if (!destGatewayInfo?.ipValid) {
            logger.info(`(service.unsyncOneDevice) RESPONSE: ERR_DEST_GATEWAY_IP_INVALID`);
            return res.json(toResponse(ERR_DEST_GATEWAY_IP_INVALID));
        }
        if (!destGatewayInfo?.tokenValid) {
            logger.info(`(service.unsyncOneDevice) RESPONSE: ERR_DEST_GATEWAY_TOKEN_INVALID`);
            return res.json(toResponse(ERR_DEST_GATEWAY_TOKEN_INVALID));
        }

        const ApiClient = CubeApi.ihostApi;
        const destGatewayClient = new ApiClient({ ip: destGatewayInfo.ip, at: destGatewayInfo.token });
        let destGatewayDeviceList: GatewayDeviceItem[] = [];

        // 拉取同步目标网关的设备列表
        let cubeApiRes = await destGatewayClient.getDeviceList();
        logger.info(`(service.unsyncOneDevice) destGatewayClient.getDeviceList() cubeApiRes: ${JSON.stringify(cubeApiRes)}`);
        if (cubeApiRes.error === 0) {
            destGatewayDeviceList = cubeApiRes.data.device_list;
        } else if (cubeApiRes.error === 401) {
            logger.info(`(service.unsyncOneDevice) RESPONSE: ERR_CUBEAPI_GET_DEVICE_TOKEN_INVALID`);
            return res.json(toResponse(ERR_CUBEAPI_GET_DEVICE_TOKEN_INVALID));
        } else if (cubeApiRes.error === 1000) {
            logger.info(`(service.unsyncOneDevice) RESPONSE: ERR_CUBEAPI_GET_DEVICE_TIMEOUT`);
            return res.json(toResponse(ERR_CUBEAPI_GET_DEVICE_TIMEOUT));
        } else {
            logger.info(`(service.unsyncOneDevice) destGatewayClient.getDeviceList() unknown error: ${JSON.stringify(cubeApiRes)}`);
            return res.json(toResponse(ERR_INTERNAL_ERROR));
        }

        const deviceData = findDeviceInDestGateway(willUnsyncDeviceId, reqSrcGatewayMac, destGatewayDeviceList);
        logger.info(`(service.unsyncOneDevice) deviceData: ${JSON.stringify(deviceData)}`);
        if (!deviceData) {
            logger.info(`(service.unsyncOneDevice) RESPONSE: ERR_UNSYNC_DEVICE_NOT_FOUND`);
            return res.json(toResponse(ERR_UNSYNC_DEVICE_NOT_FOUND));
        }

        // 调用删除设备接口
        cubeApiRes = await destGatewayClient.deleteDevice(deviceData.serial_number);
        logger.info(`(service.unsyncOneDevice) destGatewayClient.deleteDevice() cubeApiRes: ${JSON.stringify(cubeApiRes)}`);
        if (cubeApiRes.error === 0) {
            logger.info(`(service.unsyncOneDevice) RESPONSE: ERR_SUCCESS`);
            return res.json(toResponse(ERR_SUCCESS));
        } else if (cubeApiRes.error === 401) {
            logger.info(`(service.unsyncOneDevice) RESPONSE: ERR_CUBEAPI_DELETE_DEVICE_TOKEN_INVALID`);
            return res.json(toResponse(ERR_CUBEAPI_DELETE_DEVICE_TOKEN_INVALID));
        } else if (cubeApiRes.error === 110000) {
            logger.info(`(service.unsyncOneDevice) RESPONSE: ERR_CUBEAPI_DELETE_DEVICE_NOT_FOUND`);
            return res.json(toResponse(ERR_CUBEAPI_DELETE_DEVICE_NOT_FOUND));
        } else {
            logger.info(`(service.unsyncOneDevice) RESPONSE: ERR_CUBEAPI_DELETE_DEVICE_TIMEOUT`);
            return res.json(toResponse(ERR_CUBEAPI_DELETE_DEVICE_TIMEOUT));
        }
    } catch (error: any) {
        logger.error(`(service.unsyncOneDevice) error: ${error.message}`);
        return res.json(toResponse(500));
    }
}
