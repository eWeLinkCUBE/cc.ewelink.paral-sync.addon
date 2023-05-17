import _ from 'lodash';
import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import DB from '../utils/db';
import {
    getGatewayDeviceList as CubeApiGetGatewayDeviceList,
    ApiClient,
    GatewayDeviceItem
} from '../api';

/** 获取指定网关下的子设备列表(1400) */
export default async function getSourceGatewaySubDevices(req: Request, res: Response) {
    try {
        // 根据 mac 地址查找相应的网关信息
        const mac = req.params.mac.trim();
        const gatewayInfoList = await DB.getDbValue('gatewayInfoList');
        const i = _.findIndex(gatewayInfoList, { mac });
        logger.info(`(service.getSourceGatewaySubDevices) mac: ${mac}, gatewayInfoList: ${JSON.stringify(gatewayInfoList)}, i: ${i}`);
        if (i === -1) {
            return res.json(toResponse(501));
        }

        // 如果网关的 IP 无效，则返回报错信息
        const gatewayInfo = _.cloneDeep(gatewayInfoList[i]);
        logger.debug(`(service.getSourceGatewaySubDevices) gatewayInfo: ${JSON.stringify(gatewayInfo)}`);
        if (!gatewayInfo.ipValid) {
            return res.json(toResponse(502));
        }

        // 如果网关的凭证无效，则返回报错信息
        if (!gatewayInfo.tokenValid) {
            return res.json(toResponse(504));
        }

        // 发送请求，获取网关的设备数据
        const apiClient = new ApiClient({ ip: gatewayInfo.ip, at: gatewayInfo.token });
        const deviceListRes = await CubeApiGetGatewayDeviceList(apiClient);
        if (deviceListRes.error === -1) {
            return res.json(toResponse(1400));
        } else if (deviceListRes.error === 1) {
            return res.json(toResponse(504));
        }

        // TODO: 上锁
        // 请求成功的网关设备列表
        const reqDeviceList = deviceListRes.data?.device_list as GatewayDeviceItem[];
        // 本地保存的所有网关设备列表
        const localDeviceList = await DB.getDbValue('gatewayDeviceList');
        // 用于更新本地数据的设备列表
        const updateDeviceList = _.cloneDeep(localDeviceList);
        // 返回给前端的数据
        const result = [];
        logger.debug(`(service.getSourceGatewaySubDevices) before -> localDeviceList: ${JSON.stringify(localDeviceList)}`);
        for (const device of reqDeviceList) {
            const deviceId = device.serial_number;
            const found = _.find(updateDeviceList, { id: deviceId, mac });
            if (found) {
                result.push(found);
            } else {
                const tmp = {
                    id: deviceId,
                    name: device.name,
                    from: mac,
                    isSynced: false
                };
                updateDeviceList.push(tmp);
                result.push(tmp);
            }
        }
        await DB.setDbValue('gatewayDeviceList', updateDeviceList);
        logger.debug(`(service.getSourceGatewaySubDevices) after -> updateDeviceList: ${JSON.stringify(updateDeviceList)}`);
        return res.json(toResponse(0, 'Success', result));
    } catch (error: any) {
        logger.error(`get iHost token code error----------------: ${error.message}`);
        res.json(toResponse(500));
    }
}
