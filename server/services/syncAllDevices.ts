import _ from 'lodash';
import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import DB, { IDeviceItem } from '../utils/db';
import CubeApi from '../lib/cube-api';
import { GatewayDeviceItem } from '../ts/interface/CubeApi';
import { deviceInDestGateway } from './getSourceGatewaySubDevices';
import {
    createDeviceTags,
    createDeviceServiceAddr
} from './syncOneDevice';

/**
 * 创建同步设备记录
 *
 * @param deviceData 接口返回的设备数据
 * @param device 本地设备数据
 * @returns
 */
function createDeviceRecord(deviceData: GatewayDeviceItem, device: IDeviceItem) {
    const record = {
        name: deviceData.name,
        third_serial_number: deviceData.serial_number,
        manufacturer: deviceData.manufacturer,
        model: deviceData.model,
        firmware_version: deviceData.firmware_version,
        display_category: deviceData.display_category,
        capabilities: deviceData.capabilities,
        state: deviceData.state,
        tags: createDeviceTags(deviceData, device.from),
        service_address: createDeviceServiceAddr(device.id)
    };
    return record;
}

/** 同步所有设备(1600) */
export default async function syncAllDevices(req: Request, res: Response) {
    try {
        const ApiClient = CubeApi.ihostApi;

        /** 本地存储的设备列表 */
        const localDeviceList = await DB.getDbValue('gatewayDeviceList');
        /** 本地存储的网关信息列表 */
        const localGatewayInfoList = await DB.getDbValue('gatewayInfoList');

        /** 可达的本地设备列表 */
        const localDeviceListA = [];
        // 将不可达的设备排除掉
        for (const device of localDeviceList) {
            const gatewayInfo = _.find(localGatewayInfoList, { mac: device.from });
            if (gatewayInfo && gatewayInfo.ipValid && gatewayInfo.tokenValid) {
                localDeviceListA.push(device);
            }
        }

        /** 校准完 isSynced 后的本地设备列表 */
        const localDeviceListB = [];
        const destGatewayMac = await DB.getDbValue('destGatewayMac');
        const destGatewayInfo = _.find(localGatewayInfoList, { mac: destGatewayMac });
        const destGatewayClient = new ApiClient({ ip: destGatewayInfo!.ip, at: destGatewayInfo!.token });
        let cubeApiRes = null;
        cubeApiRes = await destGatewayClient.getDeviceList();
        // TODO: handle res
        const destGatewayDeviceList = cubeApiRes.data.device_list as GatewayDeviceItem[];
        // 校准 isSynced 字段
        for (const device of localDeviceListA) {
            if (deviceInDestGateway(destGatewayDeviceList, device)) {
                device.isSynced = true;
            } else {
                device.isSynced = false;
            }
            localDeviceListB.push(device);
        }

        /** 同步来源网关的设备列表缓存 */
        const srcGatewayDeviceCache: { srcGatewayClient: any; srcGatewayMac: string; deviceList: GatewayDeviceItem[]; }[] = [];
        /** 将要同步的设备记录 */
        const deviceRecord = [];
        for (const device of localDeviceListB) {
            if (device.isSynced) {
                continue;
            } else {
                const found = _.find(srcGatewayDeviceCache, { srcGatewayMac: device.from });
                if (!found) {
                    // 之前没请求过
                    const gatewayInfo = _.find(localGatewayInfoList, { mac: device.from });
                    const client = new ApiClient({ ip: gatewayInfo!.ip, at: gatewayInfo!.token});
                    cubeApiRes = await client.getDeviceList();
                    // TODO: handle res
                    const deviceList = cubeApiRes.data.device_list;
                    const deviceData = _.find(deviceList, { serial_number: device.id });
                    if (deviceData) {
                        const record = createDeviceRecord(deviceData, device);
                        deviceRecord.push(record);
                    }

                    // 将网关数据加入缓存
                    const tmp = {
                        srcGatewayClient: client,
                        srcGatewayMac: device.from,
                        deviceList
                    };
                    srcGatewayDeviceCache.push(tmp);
                } else {
                    // 之前请求过
                    const deviceData = _.find(found.deviceList, { serial_number: device.id });
                    if (deviceData) {
                        const record = createDeviceRecord(deviceData, device);
                        deviceRecord.push(record);
                    }
                }
            }
        }

        // TODO: 调用接口
        cubeApiRes = await destGatewayClient.syncDevices({ devices: deviceRecord as any });

        // TODO: 更新本地数据
        return res.json(toResponse(0));
    } catch (error: any) {
        logger.error(`get iHost token code error----------------: ${error.message}`);
        res.json(toResponse(500));
    }
}
