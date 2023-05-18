import _ from 'lodash';
import db from "./db";
import logger from "../log";
import { IHostStateInterface } from "../ts/interface/IHostState";
import { IEndpoint } from "../lib/cube-api/ts/interface/IThirdParty";
import type { IAddDevicePayload, IDeviceInfoUpdatePayload, IDeviceOnOrOfflinePayload } from "../ts/interface/ISse";
import { ApiClient } from '../api';
import { createDeviceServiceAddr, createDeviceTags } from '../services/syncOneDevice';


type IUpdateOneDevice = IUpdateDeviceSate | IUpdateInfoSate | IUpdateOnlineSate

interface IUpdateDeviceSate {
    type: "state";
    mac: string;
    payload: IHostStateInterface;
}


interface IUpdateInfoSate {
    type: "info";
    mac: string;
    payload: IDeviceInfoUpdatePayload;
}


interface IUpdateOnlineSate {
    type: "online";
    mac: string;
    payload: IDeviceOnOrOfflinePayload;
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
    const destGatewayMac = await db.getDbValue('destGatewayMac');
    /** 本地存储的网关信息列表 */
    const gatewayInfoList = await db.getDbValue('gatewayInfoList');
    /** 本地存储的所有网关设备列表 */
    const localDeviceList = await db.getDbValue('gatewayDeviceList');
    /** 同步目标网关的信息 */
    const destGatewayInfo = _.find(gatewayInfoList, { mac: destGatewayMac });
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
        logger.info(`[sse sync new device]  sync device timeout`);
    } else if (resType === 'AUTH_FAILURE') {
        logger.info(`[sse sync new device]  sync device token invalid`);
    } else if (resType === 'INVALID_PARAMETERS') {
        logger.info(`[sse sync new device]  sync device params invalid`);
    } else {
        localDeviceList.push({
            name,
            id: serial_number,
            from: mac,
            isSynced: true
        })
        // 同步成功，更新本地存储的设备列表数据
        // TODO: acquire lock
        await db.setDbValue('gatewayDeviceList', localDeviceList);
        logger.info(`[sse sync new device]  sync success`);
    }
}



/**
 * @description 删除一个设备
 * @param {IAddDevicePayload} payload
 * @param {string} mac
 */
async function deleteOneDevice(payload: IEndpoint, mac: string) {
    const { serial_number, third_serial_number } = payload;
    /** 同步目标网关的 MAC 地址 */
    const destGatewayMac = await db.getDbValue('destGatewayMac');
    /** 本地存储的网关信息列表 */
    const gatewayInfoList = await db.getDbValue('gatewayInfoList');
    /** 同步目标网关的信息 */
    const destGatewayInfo = _.find(gatewayInfoList, { mac: destGatewayMac });
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

    // 将设备从目标网关中取消同步
    /** 同步目标网关的 eWeLink Cube API client */
    const destGatewayApiClient = new ApiClient({ ip: destGatewayInfo.ip, at: destGatewayInfo.token });
    let cubeApiRes = await destGatewayApiClient.deleteDevice(serial_number);

    if (cubeApiRes.error === 0) {
        logger.info(`[sse delete device] delete device ${serial_number} ${third_serial_number}`);
        return;
    }

    if (cubeApiRes.error === 401) {
        // TODO 将token invalid状态同步到文件中
        logger.info(`[sse delete device] target token invalid`);
        return;
    } else {
        logger.info(`[sse delete device] target ip address invalid`);
        return;
    }

}


/**
 * @description 更新设备信息
 * @param {IAddDevicePayload} payload
 */
async function updateOneDevice(params: IUpdateOneDevice) {
    const { type, payload } = params;
    // TODO 更新设备状态、信息以及上下线状态

}





export default {
    syncOneDevice,
    deleteOneDevice,
    updateOneDevice
}