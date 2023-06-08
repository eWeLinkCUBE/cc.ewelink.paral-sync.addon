import _ from 'lodash';
import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import DB from '../utils/db';
import CubeApi from '../lib/cube-api';
import { GatewayDeviceItem } from '../ts/interface/CubeApi';
import {
    createDeviceTags,
    createDeviceServiceAddr
} from './syncOneDevice';
import { destTokenInvalid, srcTokenAndIPInvalid } from '../utils/dealError';
import { getDestGatewayDeviceGroup, getSrcGatewayDeviceGroup, updateSrcGatewayDeviceGroup } from '../utils/tmp';
import { isSupportDevice } from '../utils/categoryCapabilityMaping';
import SSE from '../ts/class/sse';

/**
 * 判断当前设备是否已经同步过
 *
 * @param srcDevice 同步来源网关设备数据
 * @param srcGatewayMac 同步来源网关 MAC
 * @param destDeviceList 同步目标网关设备列表
 */
function isNewDevice(srcDevice: GatewayDeviceItem, srcGatewayMac: string, destDeviceList: GatewayDeviceItem[]) {
    for (const destDevice of destDeviceList) {
        const tagDevId = _.get(destDevice, 'tags.__nsproAddonData.deviceId');
        const tagMac = _.get(destDevice, 'tags.__nsproAddonData.srcGatewayMac');
        if (tagDevId === srcDevice.serial_number && tagMac === srcGatewayMac) {
            return false;
        }
    }
    return true;
}

/** 同步所有设备(1600) */
export default async function syncAllDevices(req: Request, res: Response) {
    try {

        /** 同步目标网关的信息 */
        const destGatewayInfo = await DB.getDbValue('destGatewayInfo');
        logger.debug(`(service.syncAllDevices) destGatewayInfo: ${JSON.stringify(destGatewayInfo)}`);
        if (!destGatewayInfo?.ipValid) {
            logger.info(`(service.syncAllDevice) RESPONSE: ERR_DEST_GATEWAY_IP_INVALID`);
            return res.json(toResponse(702));
        }
        if (!destGatewayInfo?.tokenValid) {
            logger.info(`(service.syncAllDevice) RESPONSE: ERR_DEST_GATEWAY_TOKEN_INVALID`);
            return res.json(toResponse(703));
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
        const destRes = await getDestGatewayDeviceGroup();
        logger.debug(`(service.syncAllDevice) destRes: ${JSON.stringify(destRes)}`);
        if (destRes.error === 0) {
            destGatewayDeviceList = destRes.data.device_list;
        } else {
            return res.json(toResponse(destRes.error));
        }

        // 拉取所有有效的同步来源设备并汇总
        const syncDevices = [];
        for (const gateway of srcGatewayInfoListEffect) {
            const srcRes = await getSrcGatewayDeviceGroup(gateway.mac);
            logger.debug(`(service.syncAllDevice) src mac: ${gateway.mac} srcRes: ${JSON.stringify(srcRes)}`);
            // 接口报错不中止流程
            if (srcRes.error === 0) {
                const deviceList = srcRes.data.device_list;
                for (const device of deviceList) {
                    if (isSupportDevice(device) && isNewDevice(device, gateway.mac, destGatewayDeviceList)) {
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
                }
            }
        }
        logger.info(`(service.syncAllDevice) syncDevices: ${JSON.stringify(syncDevices)}`);

        // 调用添加第三方设备接口
        cubeApiRes = await destGatewayClient.syncDevices({ devices: syncDevices });
        logger.debug(`(service.syncAllDevice) destGatewayClient.syncDevices() cubeApiRes: ${JSON.stringify(cubeApiRes)}`);
        const resError = _.get(res, 'error');
        const resType = _.get(res, 'payload.type');
        if (resError === 1000) {
            logger.info(`(service.syncAllDevice) response: ERR_CUBEAPI_SYNC_DEVICE_TIMEOUT`);
            return res.json(toResponse(603));
        } else if (resType === 'AUTH_FAILURE') {
            await destTokenInvalid();
            logger.info(`(service.syncAllDevice) response: ERR_CUBEAPI_SYNC_DEVICE_TOKEN_INVALID`);
            return res.json(toResponse(605));
        } else if (resType === 'INVALID_PARAMETERS') {
            logger.info(`(service.syncAllDevice) response: ERR_CUBEAPI_SYNC_DEVICE_PARAMS_INVALID`);
            return res.json(toResponse(604));
        } else {
            logger.info(`(service.syncAllDevice) response: ERR_SUCCESS`);
            res.json(toResponse(0, 'Success', { syncDeviceIdList: syncDevices.map((item) => item.third_serial_number) }));
            // 同步所有设备成功，把结果通过 SSE 告诉前端
            SSE.send({
                name: 'sync_all_device_result',
                data: {
                    syncDeviceIdList: syncDevices.map((item) => item.third_serial_number)
                }
            });
            return;
        }

    } catch (error: any) {
        logger.error(`(service.syncAllDevice) error: ${error.message}`);
        return res.json(toResponse(500));
    }
}
