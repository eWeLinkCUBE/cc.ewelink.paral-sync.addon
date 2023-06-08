import _ from 'lodash';
import { GatewayDeviceItem } from '../ts/interface/CubeApi';
import { DestServerSentEvent } from '../ts/class/destSse';
import { ServerSentEvent } from '../ts/class/srcSse';
import logger from '../log';
import db from './db';
import CubeApi from '../lib/cube-api';
import { toResponse } from './error';
import IResponse from '../ts/interface/IResponse';
import { destTokenInvalid, srcTokenAndIPInvalid } from './dealError';

export interface ISrcGatewayDevice {
    /** 目标网关mac地址 */
    srcGatewayMac: string;
    /** 设备列表 */
    deviceList: GatewayDeviceItem[]
}

/** 同步来源网关的设备数据组 */
export const srcGatewayDeviceGroup: ISrcGatewayDevice[] = [];

/** 同步目标网关的设备数据组 */
export let destGatewayDeviceGroup: GatewayDeviceItem[] = [];

/** 目标网关sse */
export let destSseEvent: DestServerSentEvent | null = null;

/** 来源网关sse合集 */
export const srcSsePool: Map<string, ServerSentEvent> = new Map();

/**
 * 格式化设备数据（去掉不支持能力的数据）
 *
 * @param device 设备数据
 * @returns 格式化后的设备数据
 */
function formatDevice(device: GatewayDeviceItem) {
    // 不支持的能力列表
    const UNSUPPORT_CAPA = ['ota'];

    // 删除 capabilities
    const list = device.capabilities;
    _.remove(list, (item: any) => UNSUPPORT_CAPA.includes(item.capability));
    device.capabilities = list;

    // 删除 state
    const state = device.state;
    device.state = _.omit(state, UNSUPPORT_CAPA);

    return device;
}

/**
 * @description 更新
 * @export
 */
export function updateDestSse(sse: DestServerSentEvent) {
    logger.info("[updateDestSse] dest sse updated")
    destSseEvent = sse;
}

/**
 * 更新同步来源网关的设备数据组
 *
 * @param srcGatewayMac 同步来源网关 MAC 地址
 * @param deviceList 同步来源网关的设备数据
 */
export async function updateSrcGatewayDeviceGroup(srcGatewayMac: string, deviceList: GatewayDeviceItem[]) {
    const srcGatewayInfoList = await db.getDbValue('srcGatewayInfoList');
    const srcGatewayInfo = _.find(srcGatewayInfoList, { mac: srcGatewayMac });
    if (!srcGatewayInfo) {
        logger.info(`(service.syncOneDevice) RESPONSE: ERR_NO_SRC_GATEWAY_INFO`);
        return toResponse(1500);
    }
    if (!srcGatewayInfo.ipValid) {
        logger.info(`(service.syncOneDevice) RESPONSE: ERR_SRC_GATEWAY_IP_INVALID`);
        return toResponse(1501);
    }
    if (!srcGatewayInfo.tokenValid) {
        logger.info(`(service.syncOneDevice) RESPONSE: ERR_SRC_GATEWAY_TOKEN_INVALID`);
        return toResponse(1502);
    }

    const formattedDeviceList = deviceList.map((item) => formatDevice(item));

    const groupItem = _.find(srcGatewayDeviceGroup, { srcGatewayMac });
    if (groupItem) {
        groupItem.deviceList = formattedDeviceList;
    } else {
        srcGatewayDeviceGroup.push({
            srcGatewayMac,
            deviceList: formattedDeviceList
        });
    }
}



/**
 * @description 获取指定来源网关的设备列表
 * @export
 * @param {string} srcGatewayMac 目标网关的mac
 * @param {boolean} [noCache=false] 是否使用缓存
 * @returns {*}  {Promise<IResponse>}
 */
export async function getSrcGatewayDeviceGroup(srcGatewayMac: string, noCache = false): Promise<IResponse> {
    const groupItem = _.find(srcGatewayDeviceGroup, { srcGatewayMac });
    // 存在直接返回
    if (groupItem && !noCache) {
        return {
            error: 0,
            msg: "success",
            data: {
                device_list: groupItem.deviceList
            }
        };
    }

    /** 所有来源网关的信息 */
    const srcGatewayInfoList = await db.getDbValue('srcGatewayInfoList');

    /** 当前网关信息 */
    const srcGateway = _.find(srcGatewayInfoList, { mac: srcGatewayMac });

    if (!srcGateway) {
        logger.info(`[getSrcGatewayDeviceGroup] get src gateway ${srcGatewayMac} from srcGatewayInfoList fails. Here is the list ${srcGatewayInfoList}`)
        return {
            error: 606,
            msg: "src gateway not exist",
            data: {}
        };
    }

    const ApiClient = CubeApi.ihostApi;
    const srcGatewayClint = new ApiClient({ ip: srcGateway.ip, at: srcGateway.token });
    const cubeApiRes = await srcGatewayClint.getDeviceList();
    if (cubeApiRes.error === 0) {
        await updateSrcGatewayDeviceGroup(srcGatewayMac, cubeApiRes.data.device_list);
        return cubeApiRes;
    } else if (cubeApiRes.error === 400) {
        logger.warn(`[getSrcGatewayDeviceGroup] NSPro should LOGIN!!!`);
        return toResponse(1400);
    } else if (cubeApiRes.error === 401) {
        logger.warn(`[getSrcGatewayDeviceGroup] RESPONSE: ERR_CUBEAPI_GET_DEVICE_TOKEN_INVALID`);
        await srcTokenAndIPInvalid('token', srcGateway.mac);
        return toResponse(1502);
    } else if (cubeApiRes.error === 1000) {
        logger.info(`[getSrcGatewayDeviceGroup] RESPONSE: ERR_CUBEAPI_GET_DEVICE_IP_INVALID`);
        await srcTokenAndIPInvalid('ip', srcGateway.mac);
        return toResponse(1501);
    } else {
        logger.warn(`[getSrcGatewayDeviceGroup]  unknown error: ${JSON.stringify(cubeApiRes)}`);
        return toResponse(500);
    }
}


/**
 * 更新目标网关的设备数据组
 *
 * @param deviceList 同步来源网关的设备数据
 */
export async function updateDestGatewayDeviceGroup(deviceList: GatewayDeviceItem[]) {
    /** 同步目标网关的信息 */
    const destGatewayInfo = await db.getDbValue('destGatewayInfo');
    if (!destGatewayInfo?.ipValid) {
        logger.info(`(service.syncOneDevice) RESPONSE: ERR_DEST_GATEWAY_IP_INVALID`);
        toResponse(702);
    }
    if (!destGatewayInfo?.tokenValid) {
        logger.info(`(service.syncOneDevice) RESPONSE: ERR_DEST_GATEWAY_TOKEN_INVALID`);
        toResponse(703);
    }

    destGatewayDeviceGroup = deviceList;
}


/**
 * @description 获取目标网关的设备列表
 * @export
 * @returns {*}  {Promise<IResponse>}
 */
export async function getDestGatewayDeviceGroup(noCache = false): Promise<IResponse> {

    // 存在直接返回
    if (destGatewayDeviceGroup.length && !noCache) {
        return {
            error: 0,
            msg: "success",
            data: {
                device_list: destGatewayDeviceGroup
            }
        };
    }

    /** 目标网关的信息 */
    const destGatewayInfo = await db.getDbValue('destGatewayInfo');

    if (!destGatewayInfo) {
        logger.warn(`[getSrcGatewayDeviceGroup] get dest gateway from destGatewayInfo fails. Here is the list ${destGatewayInfo}`)
        return {
            error: 606,
            msg: "dest gateway not exist",
            data: {}
        };
    }


    // 获取同步目标网关的设备列表
    const ApiClient = CubeApi.ihostApi;
    const destGatewayClient = new ApiClient({ ip: destGatewayInfo.ip, at: destGatewayInfo.token });
    const cubeApiRes = await destGatewayClient.getDeviceList();
    logger.debug(`(service.syncOneDevice) destGatewayClient.getDeviceList() cubeApiRes: ${JSON.stringify(cubeApiRes)}`);
    if (cubeApiRes.error === 0) {
        destGatewayDeviceGroup = cubeApiRes.data.device_list;
        return cubeApiRes;
    } else if (cubeApiRes.error === 401) {
        logger.warn(`(service.syncOneDevice) RESPONSE: ERR_CUBEAPI_GET_DEVICE_TOKEN_INVALID`);
        return toResponse(703);
    } else if (cubeApiRes.error === 1000) {
        await destTokenInvalid();
        logger.warn(`(service.syncOneDevice) RESPONSE: ERR_CUBEAPI_GET_DEVICE_TIMEOUT`);
        return toResponse(702);
    } else {
        logger.warn(`(service.syncOneDevice) destGatewayClient.getDeviceList() unknown error: ${JSON.stringify(cubeApiRes)}`);
        return toResponse(500);
    }
}
