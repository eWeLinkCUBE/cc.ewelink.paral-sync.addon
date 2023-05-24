import _ from 'lodash';
import db, { IDeviceItem } from "./db";
import logger from "../log";
import { IHostStateInterface } from "../ts/interface/IHostState";
import { IEndpoint } from "../lib/cube-api/ts/interface/IThirdParty";
import type { IAddDevicePayload, IDeviceInfoUpdatePayload, IDeviceOnOrOfflinePayload } from "../ts/interface/ISse";
import { ApiClient } from '../api';
import { createDeviceServiceAddr, createDeviceTags } from '../services/syncOneDevice';
import { IDevice, IThirdpartyDevice } from '../lib/cube-api';
import { destTokenInvalid, srcTokenAndIPInvalid } from './dealError';
import ownSse from '../ts/class/ownSse';


type IUpdateOneDevice = IUpdateDeviceSate | IUpdateInfoSate | IUpdateOnlineSate

interface IUpdateDeviceSate {
    type: "state";
    mac: string;
    payload: IHostStateInterface;
    endpoint: IEndpoint;
}


interface IUpdateInfoSate {
    type: "info";
    mac: string;
    payload: IDeviceInfoUpdatePayload;
    endpoint: IEndpoint;
}


interface IUpdateOnlineSate {
    type: "online";
    mac: string;
    payload: IDeviceOnOrOfflinePayload;
    endpoint: IEndpoint;
}



/**
 * @description 同步一个设备
 * @param {IAddDevicePayload} device
 * @param {string} mac
 */
async function syncOneDevice(device: IAddDevicePayload, mac: string) {
    const autoSync = await db.getDbValue('autoSync');
    const { serial_number, name, manufacturer, model, display_category, capabilities, state, firmware_version } = device;
    if (!autoSync) {
        logger.info(`[sse sync new device] auto sync is close, stop sync`);
        return;
    };
    /** 同步目标网关的 MAC 地址 */
    const destGatewayInfo = await db.getDbValue('destGatewayInfo');
    if (!destGatewayInfo) {
        logger.info(`[sse sync new device] target gateway missing`);
        return;
    }
    if (!destGatewayInfo.ipValid) {
        logger.info(`[sse sync new device] target gateway ip invalid`);
        return;
    }
    if (!destGatewayInfo.tokenValid) {
        logger.info(`[sse sync new device] target gateway token invalid`);
        return;
    }

    /** 同步目标网关的 eWeLink Cube API client */
    const destGatewayApiClient = new ApiClient({ ip: destGatewayInfo.ip, at: destGatewayInfo.token });

    // 调用添加第三方设备接口
    const syncDevices = [
        {
            name,
            third_serial_number: serial_number,
            manufacturer,
            model: model,
            firmware_version,
            display_category,
            capabilities,
            state,
            tags: createDeviceTags(device, mac),
            service_address: createDeviceServiceAddr(serial_number)
        }
    ];

    logger.info(`[sse sync new device] sync device params: ${JSON.stringify(syncDevices)}`);
    const syncRes = await destGatewayApiClient.syncDevices({ devices: syncDevices });
    const resError = _.get(syncRes, 'error');
    const resType = _.get(syncRes, 'payload.type');
    if (resError === 1000) {
        await srcTokenAndIPInvalid('ip', mac);
        logger.info(`[sse sync new device]  sync device timeout`);
    } else if (resType === 'AUTH_FAILURE') {
        await srcTokenAndIPInvalid('token', mac);
        logger.info(`[sse sync new device]  sync device token invalid`);
    } else if (resType === 'INVALID_PARAMETERS') {
        logger.info(`[sse sync new device]  sync device params invalid`);
    } else {
        ownSse.send({
            name: "device_added_report",
            data: {
                id: serial_number,
                name,
                from: mac,
                isSynced: true
            }
        })
        logger.info(`[sse sync new device]  sync success`);
    }
}





/**
 * @description 删除一个设备
 * @param {IEndpoint} payload
 * @param {string} srcMac
 * @returns {*}  {Promise<void>}
 */
async function deleteOneDevice(payload: IEndpoint, srcMac: string): Promise<void> {
    const { serial_number } = payload;
    /** 同步目标网关的 MAC 地址 */
    const destGatewayInfo = await db.getDbValue('destGatewayInfo');
    if (!destGatewayInfo) {
        logger.info(`[sse delete device] target gateway missing`);
        return;
    }
    if (!destGatewayInfo.ipValid) {
        logger.info(`[sse delete device] target gateway ip invalid`);
        return;
    }
    if (!destGatewayInfo.tokenValid) {
        logger.info(`[sse delete device] target gateway token invalid`);
        return;
    }

    /** 同步目标网关的 eWeLink Cube API client */
    const destGatewayApiClient = new ApiClient({ ip: destGatewayInfo.ip, at: destGatewayInfo.token });

    // 确认删除的设备是否已同步
    let cubeApiRes = await destGatewayApiClient.getDeviceList();
    if (cubeApiRes.error === 0) {
        const deviceSynced = cubeApiRes.data.device_list.some((device: IThirdpartyDevice) => device.third_serial_number === serial_number);

        // 未同步的设备不需要取消同步
        if (!deviceSynced) return;

        // 将已同步的删除设备取消同步
        cubeApiRes = await destGatewayApiClient.deleteDevice(serial_number);

        if (cubeApiRes.error === 0) {
            ownSse.send({
                name: "device_deleted_report",
                data: {
                    deviceId: serial_number,
                    mac: srcMac
                }
            })
            logger.info(`[sse delete device] delete device ${serial_number} success`);
            return;
        }
    }

    if (cubeApiRes.error === 401) {
        await srcTokenAndIPInvalid('token', srcMac);
        logger.info(`[sse delete device] target token invalid`);
        return;
    } else {
        await srcTokenAndIPInvalid('ip', srcMac);
        logger.info(`[sse delete device] target ip address invalid`);
        return;
    }
}


/**
 * @description 更新设备信息
 * @param {IAddDevicePayload} payload
 */
async function updateOneDevice(params: IUpdateOneDevice, srcMac: string) {
    const { type, payload, endpoint } = params;
    const { serial_number, third_serial_number } = endpoint;
    /** 同步目标网关的 MAC 地址 */
    const destGatewayInfo = await db.getDbValue('destGatewayInfo');
    if (!destGatewayInfo) {
        logger.info(`[sse update device online] target gateway missing`);
        return;
    }
    if (!destGatewayInfo.ipValid) {
        logger.info(`[sse update device online] target gateway ip invalid`);
        return;
    }
    if (!destGatewayInfo.tokenValid) {
        logger.info(`[sse update device online] target gateway token invalid`);
        return;
    }
    /** 同步目标网关的 eWeLink Cube API client */
    const destGatewayApiClient = new ApiClient({ ip: destGatewayInfo.ip, at: destGatewayInfo.token });

    // 确认删除的设备是否已同步
    let cubeApiRes = await destGatewayApiClient.getDeviceList();
    if (cubeApiRes.error === 0) {
        const deviceSynced = cubeApiRes.data.device_list.some((device: IThirdpartyDevice) => device.third_serial_number === serial_number);

        // 未同步的设备不需要取消同步
        if (!deviceSynced) return;

        if (type === 'online') {
            cubeApiRes = await destGatewayApiClient.updateDeviceOnline({
                serial_number,
                third_serial_number,
                params: payload
            });
            const resError = _.get(cubeApiRes, 'error');
            const resType = _.get(cubeApiRes, 'payload.type');
            if (resError === 1000) {
                await srcTokenAndIPInvalid('ip', srcMac);
                logger.info(`[sse update device online]  update device timeout`);
            } else if (resType === 'AUTH_FAILURE') {
                await srcTokenAndIPInvalid('token', srcMac);
                logger.info(`[sse update device online]  update device token invalid`);
            } else if (resType === 'INVALID_PARAMETERS') {
                logger.info(`[sse update device online]  update device params invalid ${payload}`);
            } else {
                logger.info(`[sse update device online]  update device success`);
            }
            return;
        }

        // 更新设备信息和状态
        cubeApiRes = await destGatewayApiClient.updateDeviceState(third_serial_number, payload as IDeviceInfoUpdatePayload);
        if (cubeApiRes.error === 0) {
            const { name } = payload as IDeviceInfoUpdatePayload;
            ownSse.send({
                name: "device_info_change_report",
                data: {
                    id: third_serial_number,
                    name,
                    from: srcMac,
                    isSynced: true
                }
            })
            logger.info(`[sse update device info or state] update device ${serial_number} ${third_serial_number} success`);
            return;
        }
    }

    if (cubeApiRes.error === 401) {
        await destTokenInvalid();
        logger.info(`[sse update device info or state] target token invalid`);
        return;
    } else {
        logger.info(`[sse delete device] target ip address invalid`);
        return;
    }
}





export default {
    syncOneDevice,
    deleteOneDevice,
    updateOneDevice
}