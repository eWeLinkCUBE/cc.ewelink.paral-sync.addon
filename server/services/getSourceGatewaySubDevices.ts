import _ from 'lodash';
import { Request, Response } from 'express';
import {
    ERR_DEST_GATEWAY_IP_INVALID,
    ERR_DEST_GATEWAY_TOKEN_INVALID,
    ERR_GATEWAY_IP_INVALID,
    ERR_GATEWAY_TOKEN_INVALID,
    ERR_NO_SUCH_GATEWAY,
    ERR_CUBEAPI_GET_DEVICE_TOKEN_INVALID,
    ERR_CUBEAPI_GET_DEVICE_TIMEOUT,
    ERR_SUCCESS,
    toResponse
} from '../utils/error';
import logger from '../log';
import DB from '../utils/db';
import CubeApi from '../lib/cube-api';
import { GatewayDeviceItem } from '../ts/interface/CubeApi';

/**
 * 判断同步来源网关的设备是否在同步目标网关中
 *
 * @param srcDeviceId 同步来源网关的设备数据
 * @param destDeviceList 同步目标网关的设备数据列表
 */
export function srcDeviceInDestGateway(srcDeviceId: string, destDeviceList: GatewayDeviceItem[]) {
    for (const device of destDeviceList) {
        const deviceId = _.get(device, 'tags.__nsproAddonData.deviceId');
        if (deviceId === srcDeviceId) {
            return true;
        }
    }
    return false;
}

/** 获取指定网关下的子设备列表(1400) */
export default async function getSourceGatewaySubDevices(req: Request, res: Response) {
    try {

        /** 请求设备列表的网关 MAC 地址 */
        const reqGatewayMac = req.params.mac;
        /** 本地存储的同步来源网关信息列表 */
        const localSrcGatewayInfoList = await DB.getDbValue('srcGatewayInfoList');
        /** 本地存储的同步来源网关信息 */
        const localSrcGatewayInfo = _.find(localSrcGatewayInfoList, { mac: reqGatewayMac });

        logger.info(`(service.getSourceGatewaySubDevices) reqGatewayMac: ${reqGatewayMac}`);
        logger.info(`(service.getSourceGatewaySubDevices) localSrcGatewayInfoList: ${JSON.stringify(localSrcGatewayInfoList)}`);
        logger.info(`(service.getSourceGatewaySubDevices) localSrcGatewayInfo: ${JSON.stringify(localSrcGatewayInfo)}`);

        if (!localSrcGatewayInfo) {
            logger.info(`(service.getSourceGatewaySubDevices) RESPONSE: ERR_NO_SUCH_GATEWAY`);
            return res.json(toResponse(ERR_NO_SUCH_GATEWAY));
        }

        if (!localSrcGatewayInfo.ipValid) {
            logger.info(`(service.getSourceGatewaySubDevices) RESPONSE: ERR_GATEWAY_IP_INVALID`);
            return res.json(toResponse(ERR_GATEWAY_IP_INVALID));
        }

        if (!localSrcGatewayInfo.tokenValid) {
            logger.info(`(service.getSourceGatewaySubDevices) RESPONSE: ERR_GATEWAY_TOKEN_INVALID`);
            return res.json(toResponse(ERR_GATEWAY_TOKEN_INVALID));
        }

        /** 本地存储的同步目标网关信息 */
        const localDestGatewayInfo = await DB.getDbValue('destGatewayInfo');
        logger.info(`(service.getSourceGatewaySubDevices) localDestGatewayInfo: ${JSON.stringify(localDestGatewayInfo)}`);
        if (!localDestGatewayInfo?.ipValid) {
            logger.info(`(service.getSourceGatewaySubDevices) RESPONSE: ERR_DEST_GATEWAY_IP_INVALID`);
            return res.json(toResponse(ERR_DEST_GATEWAY_IP_INVALID));
        }

        if (!localDestGatewayInfo?.tokenValid) {
            logger.info(`(service.getSourceGatewaySubDevices) RESPONSE: ERR_DEST_GATEWAY_TOKEN_INVALID`);
            return res.json(toResponse(ERR_DEST_GATEWAY_TOKEN_INVALID));
        }

        const ApiClient = CubeApi.ihostApi;
        const srcGatewayClient = new ApiClient({ ip: localSrcGatewayInfo.ip, at: localSrcGatewayInfo.token });
        const destGatewayClient = new ApiClient({ ip: localDestGatewayInfo.ip, at: localDestGatewayInfo.token });
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

        /** 来源 MAC 地址为请求网关 MAC 地址的同步目标网关的设备列表 */
        const destGatewayDeviceListMatched: GatewayDeviceItem[] = [];
        for (const device of destGatewayDeviceList) {
            const srcGatewayMac = _.get(device, 'tags.__nsproAddonData.srcGatewayMac');
            if (srcGatewayMac === reqGatewayMac) {
                destGatewayDeviceListMatched.push(device);
            }
        }
        logger.info(`(service.getSourceGatewaySubDevices) destGatewayDeviceListMatched: ${JSON.stringify(destGatewayDeviceListMatched)}`);

        // 将已经不在同步来源网关中的设备从同步目标网关中删除掉
        for (const device of destGatewayDeviceListMatched) {
            const srcGatewayDeviceId = _.get(device, 'tags.__nsproAddonData.deviceId');
            const found = _.find(srcGatewayDeviceList, { serial_number: srcGatewayDeviceId });
            if (!found) {
                // TODO: handle res and log it
                cubeApiRes = await destGatewayClient.deleteDevice(device.serial_number);
            }
        }

        // 将同步来源网关的设备数据与同步目标网关的设备数据相比较
        // 并返回比较结果给前端
        const result = [];
        for (const device of srcGatewayDeviceList) {
            if (srcDeviceInDestGateway(device.serial_number, destGatewayDeviceListMatched)) {
                result.push({
                    name: device.name,
                    id: device.serial_number,
                    from: reqGatewayMac,
                    isSynced: true
                });
            } else {
                result.push({
                    name: device.name,
                    id: device.serial_number,
                    from: reqGatewayMac,
                    isSynced: false
                });
            }
        }

        logger.info(`(service.getSourceGatewaySubDevices) RESPONSE: ERR_SUCCESS`);
        return res.json(toResponse(ERR_SUCCESS, 'Success', result));

    } catch (error: any) {
        logger.error(`get iHost token code error----------------: ${error.message}`);
        res.json(toResponse(500));
    }
}
