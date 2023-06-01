import _ from 'lodash';
import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import DB from '../utils/db';
import CubeApi from '../lib/cube-api';
import { GatewayDeviceItem } from '../ts/interface/CubeApi';
import { destTokenInvalid, srcTokenAndIPInvalid } from '../utils/dealError';
import { getDestGatewayDeviceGroup, getSrcGatewayDeviceGroup } from '../utils/tmp';
import { isSupportDevice } from '../utils/categoryCapabilityMaping';

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

        /** 本地存储的同步目标网关信息 */
        const localDestGatewayInfo = await DB.getDbValue('destGatewayInfo');
        logger.info(`(service.getSourceGatewaySubDevices) localDestGatewayInfo: ${JSON.stringify(localDestGatewayInfo)}`);
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
        const srcRes = await getSrcGatewayDeviceGroup(localSrcGatewayInfo.mac);
        logger.info(`(service.getSourceGatewaySubDevices) srcRes: ${JSON.stringify(srcRes)}`);
        if (srcRes.error === 0) {
            srcGatewayDeviceList = srcRes.data.device_list;
        } else {
            return res.json(toResponse(srcRes.error));
        }

        // 获取同步目标网关的设备列表
        const destRes = await getDestGatewayDeviceGroup();
        logger.info(`(service.getSourceGatewaySubDevices) destRes: ${JSON.stringify(destRes)}`);
        if (destRes.error === 0) {
            destGatewayDeviceList = destRes.data.device_list;
        } else {
            return res.json(toResponse(destRes.error));
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

        // 将同步来源网关的设备数据与同步目标网关的设备数据相比较
        // 并返回比较结果给前端
        const result = [];
        for (const device of srcGatewayDeviceList) {
            if (srcDeviceInDestGateway(device.serial_number, destGatewayDeviceListMatched)) {
                result.push({
                    name: device.name,
                    id: device.serial_number,
                    from: reqGatewayMac,
                    isSynced: true,
                    isSupported: isSupportDevice(device)
                });
            } else {
                result.push({
                    name: device.name,
                    id: device.serial_number,
                    from: reqGatewayMac,
                    isSynced: false,
                    isSupported: isSupportDevice(device)
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
