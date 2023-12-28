import _ from 'lodash';
import { GatewayDeviceItem } from '../ts/interface/CubeApi';
import { DestServerSentEvent } from '../ts/class/destSse';
import { ServerSentEvent } from '../ts/class/srcSse';
import logger from '../log';
import db from './db';
import CubeApi, { ECapability } from '../lib/cube-api';
import { toResponse } from './error';
import IResponse from '../ts/interface/IResponse';
import { destTokenInvalid, srcTokenAndIPInvalid } from './dealError';

export interface ISrcGatewayDevice {
    /** 
    * 目标网关mac地址
    * Target gateway mac address
    */
    srcGatewayMac: string;
    /** 
    * 设备列表
    * Device List
    */
    deviceList: GatewayDeviceItem[]
}

/** 
* 同步来源网关的设备数据组
* Synchronize the device data group of the source gateway
*/
const srcGatewayDeviceGroup: ISrcGatewayDevice[] = [];

/** 
* 同步目标网关的设备数据组
* Synchronize the device data group of the target gateway
*/
let destGatewayDeviceGroup: GatewayDeviceItem[] = [];

/** 
* 目标网关sse
* target gateway sse
*/
export let destSseEvent: DestServerSentEvent | null = null;

/** 
* 来源网关sse合集
* Source gateway sse collection
*/
export const srcSsePool: Map<string, ServerSentEvent> = new Map();

/**
* @description 格式化设备数据（去掉不支持能力的数据）Format device data (remove data with unsupported capabilities)
 * @param {GatewayDeviceItem} device 
 * @returns {GatewayDeviceItem} 
 */
export function filterUnsupportedCapability(device: GatewayDeviceItem): GatewayDeviceItem {
    /**
     * 不支持的能力列表
     * List of capabilities to filter
     */
    const UNSUPPORTED_CAP = [ECapability.OTA];
    const curDevice = _.cloneDeep(device);
    // 删除 capabilities Delete capabilities
    const list = curDevice.capabilities;
    _.remove(list, (item: any) => UNSUPPORTED_CAP.includes(item.capability));

    curDevice.capabilities = list;

    // 删除 state delete state
    const state = curDevice.state;
    curDevice.state = _.omit(state, UNSUPPORTED_CAP);

    return curDevice;
}

/**
 * @description update destination gateway sse
 * @export
 */
export function updateDestSse(sse: DestServerSentEvent) {
    logger.info("[updateDestSse] dest sse updated")
    destSseEvent = sse;
}

/**
 * @description 更新同步来源网关的设备数据组 Update the device data group of the synchronization source gateway
 * @export
 * @param {string} srcGatewayMac 同步来源网关 MAC 地址 Sync source gateway MAC address
 * @param {GatewayDeviceItem[]} deviceList 同步来源网关的设备数据 Synchronize device data from source gateway
 * @returns {*} 
 */
export async function updateSrcGatewayDeviceGroup(srcGatewayMac: string, deviceList: GatewayDeviceItem[]) {
    const srcGatewayInfoList = await db.getDbValue('srcGatewayInfoList');
    const srcGatewayInfo = _.find(srcGatewayInfoList, { mac: srcGatewayMac });
    if (!srcGatewayInfo) {
        logger.info(`[updateSrcGatewayDeviceGroup] RESPONSE: ERR_NO_SRC_GATEWAY_INFO`);
        return toResponse(1500);
    }
    if (!srcGatewayInfo.ipValid) {
        logger.info(`[updateSrcGatewayDeviceGroup] RESPONSE: ERR_SRC_GATEWAY_IP_INVALID`);
        return toResponse(1501);
    }
    if (!srcGatewayInfo.tokenValid) {
        logger.info(`[updateSrcGatewayDeviceGroup] RESPONSE: ERR_SRC_GATEWAY_TOKEN_INVALID`);
        return toResponse(1502);
    }

    // logger.info(`[updateSrcGatewayDeviceGroup] updated device info ${JSON.stringify(deviceList)}`)

    const groupItem = _.find(srcGatewayDeviceGroup, { srcGatewayMac });
    if (groupItem) {
        groupItem.deviceList = deviceList;
    } else {
        srcGatewayDeviceGroup.push({
            srcGatewayMac,
            deviceList
        });
    }
}



/**
 * @description 获取指定来源网关的设备列表 Get the device list of the specified source gateway
 * @export
 * @param {string} srcGatewayMac 目标网关的mac Target gateway mac 
 * @param {boolean} [noCache=false] 是否使用缓存 Whether to use cache 
 * @returns {*}  {Promise<IResponse>}
 */
export async function getSrcGatewayDeviceGroup(srcGatewayMac: string, noCache = false): Promise<IResponse> {
    const groupItem = _.find(srcGatewayDeviceGroup, { srcGatewayMac });
    // 存在缓存直接返回 Cache exist then return it directly
    if (groupItem && !noCache) {
        return {
            error: 0,
            msg: "success",
            data: {
                device_list: groupItem.deviceList
            }
        };
    }

    const srcGatewayInfoList = await db.getDbValue('srcGatewayInfoList');

    const srcGateway = _.find(srcGatewayInfoList, { mac: srcGatewayMac });

    if (!srcGateway) {
        logger.info(`[getSrcGatewayDeviceGroup] get src gateway ${srcGatewayMac} from srcGatewayInfoList fails. Here is the list ${JSON.stringify(srcGatewayInfoList)}`)
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
 * @description 更新目标网关的设备数据组 Update the device data group of the target gateway
 * @export
 * @param {GatewayDeviceItem[]} deviceList 同步来源网关的设备数据 Synchronize device data from source gateway
 */
export async function updateDestGatewayDeviceGroup(deviceList: GatewayDeviceItem[]) {
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
 * @description 获取目标网关的设备列表 Get the device list of the target gateway
 * @export 
 * @returns {*}  {Promise<IResponse>}
 */
export async function getDestGatewayDeviceGroup(noCache = false): Promise<IResponse> {

    if (destGatewayDeviceGroup.length && !noCache) {
        return {
            error: 0,
            msg: "success",
            data: {
                device_list: destGatewayDeviceGroup
            }
        };
    }

    const destGatewayInfo = await db.getDbValue('destGatewayInfo');

    if (!destGatewayInfo) {
        logger.warn(`[getSrcGatewayDeviceGroup] get dest gateway from destGatewayInfo fails. Here is the list ${destGatewayInfo}`)
        return {
            error: 606,
            msg: "dest gateway not exist",
            data: {}
        };
    }


    // 获取同步目标网关的设备列表 Get the device list of the synchronization target gateway
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
