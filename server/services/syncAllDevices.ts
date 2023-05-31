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
import { updateSrcGatewayDeviceGroup } from '../utils/tmp';

/** 同步所有设备(1600) */
export default async function syncAllDevices(req: Request, res: Response) {
    try {

        /** 同步目标网关的信息 */
        const destGatewayInfo = await DB.getDbValue('destGatewayInfo');
        logger.info(`(service.syncAllDevices) destGatewayInfo: ${JSON.stringify(destGatewayInfo)}`);
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
        cubeApiRes = await destGatewayClient.getDeviceList();
        logger.info(`(service.syncAllDevice) destGatewayClient.getDeviceList() cubeApiRes: ${JSON.stringify(cubeApiRes)}`);
        if (cubeApiRes.error === 0) {
            destGatewayDeviceList = cubeApiRes.data.device_list;
        } else if (cubeApiRes.error === 401) {
            await destTokenInvalid();
            logger.info(`(service.syncAllDevice) RESPONSE: ERR_CUBEAPI_GET_DEVICE_TOKEN_INVALID`);
            return res.json(toResponse(600));
        } else if (cubeApiRes.error === 1000) {
            logger.info(`(service.syncAllDevice) RESPONSE: ERR_CUBEAPI_GET_DEVICE_TIMEOUT`);
            return res.json(toResponse(601));
        } else {
            logger.info(`(service.syncAllDevice) destGatewayClient.getDeviceList() unknown error: ${JSON.stringify(cubeApiRes)}`);
            return res.json(toResponse(500));
        }

        // 拉取所有有效的同步来源设备并汇总
        const syncDevices = [];
        const srcDeviceGroup = [];
        for (const gateway of srcGatewayInfoListEffect) {
            const srcGatewayClient = new ApiClient({ ip: gateway.ip, at: gateway.token });
            // 获取同步来源网关的设备列表
            cubeApiRes = await srcGatewayClient.getDeviceList();
            logger.info(`(service.syncAllDevice) srcGatewayClient.getDeviceList() cubeApiRes: ${JSON.stringify(cubeApiRes)}`);
            // 接口报错不中止流程
            if (cubeApiRes.error === 0) {
                const deviceList = cubeApiRes.data.device_list;
                updateSrcGatewayDeviceGroup(gateway.mac, deviceList);
                srcDeviceGroup.push({
                    gatewayMac: gateway.mac,
                    deviceList
                });
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
            } else if (cubeApiRes.error === 400) {
                logger.warn(`(service.syncAllDevice) srcGatewayClient.getDeviceList() NSPro should LOGIN!!!`);
            } else if (cubeApiRes.error === 401) {
                await srcTokenAndIPInvalid('token', gateway.mac);
            } else if (cubeApiRes.error === 1000) {
                await srcTokenAndIPInvalid('ip', gateway.mac);
            } else {
                logger.warn(`(service.syncAllDevice) srcGatewayClient.getDeviceList() unknown error: ${JSON.stringify(cubeApiRes)}`);
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
            return res.json(toResponse(603));
        } else if (resType === 'AUTH_FAILURE') {
            await destTokenInvalid();
            logger.info(`(service.syncAllDevice) response: ERR_CUBEAPI_SYNC_DEVICE_TOKEN_INVALID`);
            return res.json(toResponse(605));
        } else if (resType === 'INVALID_PARAMETERS') {
            logger.info(`(service.syncAllDevice) response: ERR_CUBEAPI_SYNC_DEVICE_PARAMS_INVALID`);
            return res.json(toResponse(604));
        } else {
            // TODO: 将以下功能迁移到 SSE 中
            // 同步成功后，需要设置设备的在线状态
            cubeApiRes = await destGatewayClient.getDeviceList();
            logger.info(`(service.syncAllDevice) destGatewayClient.getDeviceList() cubeApiRes: ${JSON.stringify(cubeApiRes)}`);
            if (cubeApiRes.error === 0) {
                destGatewayDeviceList = cubeApiRes.data.device_list;
            } else if (cubeApiRes.error === 401) {
                await destTokenInvalid();
                logger.info(`(service.syncAllDevice) RESPONSE: ERR_CUBEAPI_GET_DEVICE_TOKEN_INVALID`);
                return res.json(toResponse(600));
            } else if (cubeApiRes.error === 1000) {
                logger.info(`(service.syncAllDevice) RESPONSE: ERR_CUBEAPI_GET_DEVICE_TIMEOUT`);
                return res.json(toResponse(601));
            } else {
                logger.info(`(service.syncAllDevice) destGatewayClient.getDeviceList() unknown error: ${JSON.stringify(cubeApiRes)}`);
                return res.json(toResponse(500));
            }
            for (const srcDeviceGroupItem of srcDeviceGroup) {
                // 遍历每一组
                const srcDeviceGroupGatewayMac = srcDeviceGroupItem.gatewayMac;
                for (const srcDevice of srcDeviceGroupItem.deviceList) {
                    // 遍历每一个来源设备
                    for (const destDevice of destGatewayDeviceList) {
                        // 找到相应的目标设备
                        const sDevId = _.get(destDevice, 'tags.__nsproAddonData.deviceId');
                        const sMac = _.get(destDevice, 'tags.__nsproAddonData.srcGatewayMac');
                        if (sDevId === srcDevice.serial_number && sMac === srcDeviceGroupGatewayMac) {
                            const onlineParams = {
                                serial_number: destDevice.serial_number,
                                third_serial_number: srcDevice.serial_number,
                                params: {
                                    online: srcDevice.online
                                }
                            };
                            logger.info(`(service.syncAllDevice) onlineParams: ${JSON.stringify(onlineParams)}`);
                            cubeApiRes = await destGatewayClient.updateDeviceOnline(onlineParams);
                            logger.info(`(service.syncAllDevice) srcGatewayClient.updateDeviceOnline() cubeApiRes: ${JSON.stringify(cubeApiRes)}`);
                            break;
                        }
                    }
                }
            }

            return res.json(toResponse(0, 'Success', { syncDeviceIdList: syncDevices.map((item) => item.third_serial_number) }));
        }

    } catch (error: any) {
        logger.error(`(service.syncAllDevice) error: ${error.message}`);
        return res.json(toResponse(500));
    }
}
