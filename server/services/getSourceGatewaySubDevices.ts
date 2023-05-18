import _ from 'lodash';
import { Request, Response } from 'express';
import {
    ERR_GATEWAY_IP_INVALID,
    ERR_GATEWAY_TOKEN_INVALID,
    ERR_NO_SUCH_GATEWAY,
    ERR_SUCCESS,
    toResponse
} from '../utils/error';
import logger from '../log';
import DB, { IGatewayInfoItem } from '../utils/db';
import CubeApi from '../lib/cube-api';
import { GatewayDeviceItem } from '../ts/interface/CubeApi';
import { ERR_CUBEAPI_GET_DEVICE_TOKEN_INVALID } from '../utils/error';
import { ERR_CUBEAPI_GET_DEVICE_TIMEOUT } from '../utils/error';

/**
 * 创建目标网关的 API client
 */
function createDestGatewayClient(gatewayList: IGatewayInfoItem[], destMac: string) {
    const ApiClient = CubeApi.ihostApi;
    if (!destMac) {
        return null;
    } else {
        const found = _.find(gatewayList, { mac: destMac });
        if (found && found.ipValid && found.tokenValid) {
            return new ApiClient({ ip: found.ip, at: found.token });
        } else {
            return null;
        }
    }
}

/** 获取指定网关下的子设备列表(1400) */
export default async function getSourceGatewaySubDevices(req: Request, res: Response) {
    try {
        /** 请求的网关 MAC 地址 */
        const reqGatewayMac = req.params.mac;
        /** 本地存储的网关信息列表 */
        const localGatewayInfoList = await DB.getDbValue('gatewayInfoList');
        /** 同步目标网关的 MAC 地址 */
        const destGatewayMac = await DB.getDbValue('destGatewayMac');
        /** 请求的网关信息 */
        const reqGatewayInfo = _.find(localGatewayInfoList, { mac: reqGatewayMac });

        logger.info(`(service.getSourceGatewaySubDevices) reqGatewayMac: ${reqGatewayMac}`);
        logger.info(`(service.getSourceGatewaySubDevices) localGatewayInfoList: ${JSON.stringify(localGatewayInfoList)}`);
        logger.info(`(service.getSourceGatewaySubDevices) destGatewayMac: ${JSON.stringify(destGatewayMac)}`);
        logger.info(`(service.getSourceGatewaySubDevices) reqGatewayInfo: ${JSON.stringify(reqGatewayInfo)}`);

        if (!reqGatewayInfo) {
            logger.info(`(service.getSourceGatewaySubDevices) response: ERR_NO_SUCH_GATEWAY`);
            return res.json(toResponse(ERR_NO_SUCH_GATEWAY));
        }
        if (!reqGatewayInfo.ipValid) {
            logger.info(`(service.getSourceGatewaySubDevices) response: ERR_GATEWAY_IP_INVALID`);
            return res.json(toResponse(ERR_GATEWAY_IP_INVALID));
        }
        if (!reqGatewayInfo.tokenValid) {
            logger.info(`(service.getSourceGatewaySubDevices) response: ERR_GATEWAY_TOKEN_INVALID`);
            return res.json(toResponse(ERR_GATEWAY_TOKEN_INVALID));
        }

        const ApiClient = CubeApi.ihostApi;
        const reqGatewayClient = new ApiClient({ ip: reqGatewayInfo.ip, at: reqGatewayInfo.token });
        let destGatewayClient = createDestGatewayClient(localGatewayInfoList, destGatewayMac);
        let cubeApiRes = null;
        cubeApiRes = await reqGatewayClient.getDeviceList();
        logger.info(`(service.getSourceGatewaySubDevices) reqGatewayClient.getDeviceList() res: ${JSON.stringify(cubeApiRes)}`);
        const resError = _.get(cubeApiRes, 'error');
        const resData = _.get(cubeApiRes, 'data');
        if (resError === 0) {
            // 获取网关设备列表成功
            /** 请求网关的设备数据 */
            const reqGatewayList = resData.device_list as GatewayDeviceItem[];
            /** 本地存储的设备列表 */
            const localDeviceList = await DB.getDbValue('gatewayDeviceList');
            /** 将要更新的本地存储设备列表 */
            const localDeviceListUpdate = [];
            /** 返回给前端的结果 */
            const result = [];

            logger.info(`(service.getSourceGatewaySubDevices) before update -> localDeviceList: ${JSON.stringify(localDeviceList)}`);

            // TODO: 拉目标网关的设备，修改 localDeviceList 的同步字段

            for (const device of localDeviceList) {
                const deviceInReqGateway = _.find(reqGatewayList, { serial_number: device.id });
                const deviceFromReqGateway = device.from === reqGatewayMac;
                if (deviceFromReqGateway && !deviceInReqGateway) {
                    // 设备已不在来源网关设备列表中，删除它
                    if (destGatewayClient && device.isSynced) {
                        cubeApiRes = await destGatewayClient.deleteDevice(device.id);
                        logger.info(`(service.getSourceGatewaySubDevices) destGatewayClient.deleteDevice() res: ${JSON.stringify(cubeApiRes)}`);
                    }
                } else {
                    localDeviceListUpdate.push(device);
                }
            }
            for (const device of reqGatewayList) {
                const found = _.find(localDeviceListUpdate, { id: device.serial_number, from: reqGatewayMac });
                if (!found) {
                    // 如果设备不在本地存储中，添加它
                    const record = {
                        name: device.name,
                        id: device.serial_number,
                        from: reqGatewayMac,
                        isSynced: false
                    };
                    localDeviceListUpdate.push(record);
                    result.push(record);
                } else {
                    result.push(found);
                }
            }

            logger.info(`(service.getSourceGatewaySubDevices) after update -> localDeviceListUpdate: ${JSON.stringify(localDeviceListUpdate)}`);

            // TODO: acquire lock
            await DB.setDbValue('gatewayDeviceList', localDeviceListUpdate);
            logger.info(`(service.getSourceGatewaySubDevices) response: Success`);
            return res.json(toResponse(ERR_SUCCESS, 'Success', result));
        } else if (resError === 401) {
            logger.info(`(service.getSourceGatewaySubDevices) response: ERR_CUBEAPI_GET_DEVICE_TOKEN_INVALID`);
            return res.json(toResponse(ERR_CUBEAPI_GET_DEVICE_TOKEN_INVALID));
        } else {
            logger.info(`(service.getSourceGatewaySubDevices) response: ERR_CUBEAPI_GET_DEVICE_TIMEOUT`);
            return res.json(toResponse(ERR_CUBEAPI_GET_DEVICE_TIMEOUT));
        }
    } catch (error: any) {
        logger.error(`get iHost token code error----------------: ${error.message}`);
        res.json(toResponse(500));
    }
}
