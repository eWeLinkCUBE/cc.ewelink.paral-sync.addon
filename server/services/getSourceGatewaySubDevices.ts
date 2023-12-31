import _ from 'lodash';
import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import DB from '../utils/db';
import { GatewayDeviceItem } from '../ts/interface/CubeApi';
import { getDestGatewayDeviceGroup, getSrcGatewayDeviceGroup } from '../utils/tmp';

/**
 * 判断同步来源网关的设备是否在同步目标网关中
 * Determine whether the device of the synchronization source gateway is in the synchronization target gateway
 *
 * @param srcDeviceId 同步来源网关的设备数据 Synchronize device data from source gateway
 * @param destDeviceList 同步目标网关的设备数据列表 Synchronize the device data list of the target gateway
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

/** 
* 获取指定网关下的子设备列表(1400)
* Get the list of sub-devices under the specified gateway (1400)
*/
export default async function getSourceGatewaySubDevices(req: Request, res: Response) {
    try {

        /** 
        * 请求设备列表的网关 MAC 地址
        * Gateway MAC address for requesting device list
        */
        const reqGatewayMac = req.params.mac;
        /** 
        * 是否强制刷新同步来源网关的设备列表，这个参数值为 1 表示强制刷新，否则使用缓存数据
        * Whether to force refresh the device list of the synchronization source gateway. A value of 1 indicates forced refresh, otherwise cached data will be used.
         */
        const forceRefreshSrc = req.query.forceSrc;
        /** 
        * 本地存储的同步来源网关信息列表
        * Locally stored synchronization source gateway information list
        */
        const localSrcGatewayInfoList = await DB.getDbValue('srcGatewayInfoList');
        /** 
        * 本地存储的同步来源网关信息
        * Locally stored synchronization source gateway information
        */
        const localSrcGatewayInfo = _.find(localSrcGatewayInfoList, { mac: reqGatewayMac });

        logger.info(`(service.getSourceGatewaySubDevices) reqGatewayMac: ${reqGatewayMac}`);
        logger.info(`(service.getSourceGatewaySubDevices) forceRefreshSrc: ${forceRefreshSrc}`);
        logger.debug(`(service.getSourceGatewaySubDevices) localSrcGatewayInfoList: ${JSON.stringify(localSrcGatewayInfoList)}`);
        logger.debug(`(service.getSourceGatewaySubDevices) localSrcGatewayInfo: ${JSON.stringify(localSrcGatewayInfo)}`);

        if (!localSrcGatewayInfo) {
            logger.info(`(service.getSourceGatewaySubDevices) RESPONSE: ERR_NO_SRC_GATEWAY_INFO`);
            return res.json(toResponse(1500));
        }

        if (!localSrcGatewayInfo.ipValid) {
            logger.info(`(service.getSourceGatewaySubDevices) RESPONSE: ERR_SRC_GATEWAY_IP_INVALID`);
            return res.json(toResponse(1501));
        }

        if (!localSrcGatewayInfo.tokenValid) {
            logger.info(`(service.getSourceGatewaySubDevices) RESPONSE: ERR_SRC_GATEWAY_TOKEN_INVALID`);
            return res.json(toResponse(1502));
        }

        /** 
        * 本地存储的同步目标网关信息
        * Locally stored synchronization target gateway information
         */
        const localDestGatewayInfo = await DB.getDbValue('destGatewayInfo');
        logger.debug(`(service.getSourceGatewaySubDevices) localDestGatewayInfo: ${JSON.stringify(localDestGatewayInfo)}`);
        if (!localDestGatewayInfo?.ipValid) {
            logger.info(`(service.getSourceGatewaySubDevices) RESPONSE: ERR_DEST_GATEWAY_IP_INVALID`);
            return res.json(toResponse(702));
        }

        if (!localDestGatewayInfo?.tokenValid) {
            logger.info(`(service.getSourceGatewaySubDevices) RESPONSE: ERR_DEST_GATEWAY_TOKEN_INVALID`);
            return res.json(toResponse(703));
        }

        let srcGatewayDeviceList: GatewayDeviceItem[] = [];
        let destGatewayDeviceList: GatewayDeviceItem[] = [];

        // 获取同步来源网关的设备列表
        // Get the device list of the synchronization source gateway
        const srcRes = await getSrcGatewayDeviceGroup(localSrcGatewayInfo.mac, forceRefreshSrc === '1');
        logger.debug(`(service.getSourceGatewaySubDevices) srcRes: ${JSON.stringify(srcRes)}`);
        if (srcRes.error === 0) {
            srcGatewayDeviceList = srcRes.data.device_list;
        } else {
            return res.json(toResponse(srcRes.error));
        }

        // 获取同步目标网关的设备列表
        // Get the device list of the synchronization target gateway
        const destRes = await getDestGatewayDeviceGroup();
        logger.debug(`(service.getSourceGatewaySubDevices) destRes: ${JSON.stringify(destRes)}`);
        if (destRes.error === 0) {
            destGatewayDeviceList = destRes.data.device_list;
        } else {
            return res.json(toResponse(destRes.error));
        }

        /** 
        * 来源 MAC 地址为请求网关 MAC 地址的同步目标网关的设备列表
        * List of devices whose source MAC address is the synchronization destination gateway requesting the gateway MAC address
        */
        const destGatewayDeviceListMatched: GatewayDeviceItem[] = [];
        for (const device of destGatewayDeviceList) {
            const srcGatewayMac = _.get(device, 'tags.__nsproAddonData.srcGatewayMac');
            if (srcGatewayMac === reqGatewayMac) {
                destGatewayDeviceListMatched.push(device);
            }
        }
        logger.debug(`(service.getSourceGatewaySubDevices) destGatewayDeviceListMatched: ${JSON.stringify(destGatewayDeviceListMatched)}`);

        // 将同步来源网关的设备数据与同步目标网关的设备数据相比较 并返回比较结果给前端
        // Compare the device data of the synchronization source gateway with the device data of the synchronization target gateway and return the comparison results to the front end
        const result = [];
        for (const device of srcGatewayDeviceList) {
            if (srcDeviceInDestGateway(device.serial_number, destGatewayDeviceListMatched)) {
                result.push({
                    name: device.name,
                    id: device.serial_number,
                    from: reqGatewayMac,
                    isSynced: true,
                    isSupported: true
                });
            } else {
                result.push({
                    name: device.name,
                    id: device.serial_number,
                    from: reqGatewayMac,
                    isSynced: false,
                    isSupported: true
                });
            }
        }

        logger.info(`(service.getSourceGatewaySubDevices) RESPONSE: ERR_SUCCESS`);
        return res.json(toResponse(0, 'Success', result));

    } catch (error: any) {
        logger.error(`(service.getSourceGatewaySubDevices) error: ${error.message}`);
        return res.json(toResponse(500));
    }
}
