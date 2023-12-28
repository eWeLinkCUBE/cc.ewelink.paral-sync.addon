import _, { get } from 'lodash';
import db, { IGatewayInfoItem } from './db';
import logger from '../log';
import { IHostStateInterface } from '../ts/interface/IHostState';
import { IEndpoint } from '../lib/cube-api/ts/interface/IThirdParty';
import type { IAddDevicePayload, IDeviceInfoUpdatePayload, IDeviceOnOrOfflinePayload } from '../ts/interface/ISse';
import { createDeviceServiceAddr, createDeviceTags } from '../services/syncOneDevice';
import { IThirdpartyDevice } from '../lib/cube-api';
import { destTokenInvalid, srcTokenAndIPInvalid } from './dealError';
import sse from '../ts/class/sse';
import srcSse, { ESseStatus } from '../ts/class/srcSse';
import CubeApi from '../lib/cube-api';
import { destSseEvent, filterUnsupportedCapability, getDestGatewayDeviceGroup, getSrcGatewayDeviceGroup, srcSsePool, updateDestGatewayDeviceGroup, updateSrcGatewayDeviceGroup } from './tmp';
import destSse from '../ts/class/destSse';
import { GatewayDeviceItem } from '../ts/interface/CubeApi';
import { getSwitchChannelNum } from './tools';
import { ICapability } from '../lib/cube-api/ts/interface/IDevice';

type IUpdateOneDevice = IUpdateDeviceSate | IUpdateInfoSate | IUpdateOnlineSate;

interface IUpdateDeviceSate {
    type: 'state';
    mac: string;
    payload: IHostStateInterface;
    endpoint: IEndpoint;
}

interface IUpdateInfoSate {
    type: 'info';
    mac: string;
    payload: IDeviceInfoUpdatePayload;
    endpoint: IEndpoint;
}

interface IUpdateOnlineSate {
    type: 'online';
    mac: string;
    payload: IDeviceOnOrOfflinePayload;
    endpoint: IEndpoint;
}

/**
 * @description 同步一个设备 Sync a device
 * @param {IAddDevicePayload} device
 * @param {string} mac
 */
async function syncOneDevice(device: IAddDevicePayload, mac: string) {
    const autoSync = await db.getDbValue('autoSync');
    const { serial_number, name, manufacturer, model, display_category, firmware_version } = device;

    /** 
    * 同步目标网关的 MAC 地址
    * Synchronize the MAC address of the target gateway
    */
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

    // 将新设备添加到缓存数据中 Add new devices to cached data
    const srcGatewayRes = await getSrcGatewayDeviceGroup(mac, true);
    if (srcGatewayRes.error !== 0) {
        logger.info(`[sse sync new device] get src gateway device group error ${JSON.stringify(srcGatewayRes)}`);
        return;
    }

    const srcDeviceGroup = srcGatewayRes.data.device_list as GatewayDeviceItem[];
    logger.debug("cur srcDeviceGroup => ", JSON.stringify(srcDeviceGroup))
    const srcDeviceData = srcDeviceGroup.find((item: { serial_number: string }) => item.serial_number === serial_number);

    if (!srcDeviceData) return;

    if (!autoSync) {
        sse.send({
            name: 'device_added_report',
            data: {
                id: serial_number,
                name,
                from: mac,
                isSynced: false,
                isSupported: true,
            },
        });
        logger.info(`[sse sync new device] device ${serial_number} not auto sync [autoSync => ${autoSync}]`);
        return;
    }

    /** 
    * 同步目标网关的 eWeLink Cube API client
    * Sync the eWeLink Cube API client of the target gateway
    */
    const ApiClient = CubeApi.ihostApi;
    const destGatewayApiClient = new ApiClient({ ip: destGatewayInfo.ip, at: destGatewayInfo.token });

    // 删除不支持的能力 filter unsupported capability
    const formattedDevice = filterUnsupportedCapability(srcDeviceData);
    const syncDevices = [
        {
            name,
            third_serial_number: serial_number,
            manufacturer,
            model: model,
            firmware_version,
            display_category,
            capabilities: formattedDevice.capabilities,
            state: formattedDevice.state,
            tags: createDeviceTags(device, mac),
            service_address: createDeviceServiceAddr(serial_number),
        },
    ];

    logger.info(`[sse sync new device] sync device params: ${JSON.stringify(syncDevices)}`);
    const syncRes = await destGatewayApiClient.syncDevices({ devices: syncDevices });
    const resError = _.get(syncRes, 'error');
    const resType = _.get(syncRes, 'payload.type');

    if (resError === 1000) {
        await srcTokenAndIPInvalid('ip', mac);
        logger.warn(`[sse sync new device]  sync device timeout`);
    } else if (resType === 'AUTH_FAILURE') {
        await srcTokenAndIPInvalid('token', mac);
        logger.warn(`[sse sync new device]  sync device token invalid`);
    } else if (resType === 'INVALID_PARAMETERS') {
        logger.warn(`[sse sync new device]  sync device params invalid`);
    } else {
        sse.send({
            name: 'device_added_report',
            data: {
                id: serial_number,
                name,
                from: mac,
                isSynced: true,
                isSupported: true,
            },
        });
        logger.info(`[sse sync new device]  sync success`);
    }
}

/**
 * @description 删除一个设备 Delete a device
 * @param {IEndpoint} payload
 * @param {string} srcMac
 * @returns {*}  {Promise<void>}
 */
async function deleteOneDevice(payload: IEndpoint, srcMac: string): Promise<void> {
    const { serial_number } = payload;
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

    // 将设备在缓存的数据中删除 Remove device from cached data
    const srcGatewayRes = await getSrcGatewayDeviceGroup(srcMac);
    if (srcGatewayRes.error !== 0) {
        logger.info(`[sse delete device] get src gateway device group error ${JSON.stringify(srcGatewayRes)}`);
        return;
    }

    const srcDeviceGroup = srcGatewayRes.data.device_list as GatewayDeviceItem[];
    logger.debug(`[sse delete device] before remove ${serial_number} from src device group ${JSON.stringify(srcDeviceGroup)} `);
    // 删除符合条件的设备 Remove eligible devices
    _.remove(srcDeviceGroup, { serial_number });
    logger.debug(`[sse delete device] after remove ${serial_number} from src device group ${JSON.stringify(srcDeviceGroup)} `);
    // 更新缓存数据 Update cached data
    await updateSrcGatewayDeviceGroup(srcMac, srcDeviceGroup);

    const ApiClient = CubeApi.ihostApi;
    const destGatewayApiClient = new ApiClient({ ip: destGatewayInfo.ip, at: destGatewayInfo.token });

    // 确认删除的设备是否已同步 Confirm that the deleted device has been synced
    let cubeApiRes = await destGatewayApiClient.getDeviceList();
    if (cubeApiRes.error === 0) {
        const syncedDevice = cubeApiRes.data.device_list.find((device: IThirdpartyDevice) => device.third_serial_number === serial_number);
        logger.debug(`[sse delete device] cubeApiRes.data.device_list`, cubeApiRes.data.device_list);
        // send delete sse
        sse.send({
            name: 'device_deleted_report',
            data: {
                deviceId: serial_number,
                mac: srcMac,
            },
        });
        logger.info(`sended device_deleted_report`);
        // 未同步的设备不需要取消同步 Unsynced devices do not need to be desynchronized
        if (!syncedDevice) return;

        // 将已同步的删除设备取消同步 Unsynchronize a synced deleted device
        cubeApiRes = await destGatewayApiClient.deleteDevice(syncedDevice.serial_number);

        if (cubeApiRes.error === 0) {
            logger.info(`[sse delete device] delete device ${serial_number} success`);
            return;
        }
    }

    logger.info(`[sse delete device] getDeviceList res error => `, JSON.stringify(cubeApiRes));
    if (cubeApiRes.error === 401) {
        await srcTokenAndIPInvalid('token', srcMac);
        logger.warn(`[sse delete device] target token invalid`);
        return;
    } else if (cubeApiRes.error === 1000) {
        await srcTokenAndIPInvalid('ip', srcMac);
        logger.warn(`[sse delete device] target ip address invalid`);
        return;
    } else {
        logger.error(`[sse delete device] unknown error: ${JSON.stringify(cubeApiRes)}`);
        return;
    }
}

/**
 * @description 更新设备信息 Update device information
 * @param {IUpdateOneDevice} params
 * @param {string} srcMac
 * @returns {*}  {Promise<void>}
 */
async function updateOneDevice(params: IUpdateOneDevice, srcMac: string): Promise<void> {
    const { type, payload, endpoint } = params;
    const { serial_number } = endpoint;
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

    // 更新缓存数据 Update cached data
    const srcGatewayRes = await getSrcGatewayDeviceGroup(srcMac);
    if (srcGatewayRes.error !== 0) {
        logger.error(`[sse update device online] get src gateway device group error ${JSON.stringify(srcGatewayRes)}`);
        return;
    }

    const srcDeviceGroup = srcGatewayRes.data.device_list as GatewayDeviceItem[];
    let srcDeviceData = null;
    srcDeviceGroup.forEach((device) => {
        if (device.serial_number === serial_number) {
            srcDeviceData = device;
            if (type === 'info') {
                device.name = payload.name;
                if (payload.capabilities) {
                    device.capabilities = mergeCapabilities(device.capabilities, payload.capabilities);
                }

                if (payload.tags)
                    device.tags = payload.tags;
            }

            if (type === 'online') {
                device.online = payload.online;
            }

            if (type === 'state') {
                device.state = payload;
            }
        }
    });
    await updateSrcGatewayDeviceGroup(srcMac, srcDeviceGroup);

    /** 
    * 同步目标网关的 eWeLink Cube API client
    * Sync the eWeLink Cube API client of the target gateway
    */
    const ApiClient = CubeApi.ihostApi;
    const destGatewayApiClient = new ApiClient({ ip: destGatewayInfo.ip, at: destGatewayInfo.token });

    // 更新目标网关 Update target gateway
    let cubeApiRes = await destGatewayApiClient.getDeviceList();
    if (cubeApiRes.error === 0) {
        const syncedDevice = cubeApiRes.data.device_list.find((device: IThirdpartyDevice) => device.third_serial_number === serial_number);

        // 未同步的设备不需要取消同步 Unsynced devices do not need to be desynchronized
        if (!syncedDevice) return;

        if (type === 'info') {

            // name is useless, delete it
            const params = _.cloneDeep(payload);
            _.unset(params, 'name');
            if (_.isEmpty(params)) return;

            if (payload.tags) {
                _.assign(params, { tags: payload.tags });
            }

            _.assign(params, { capabilities: payload.capabilities || [] });

            // 更新设备信息和状态 Update device information and status
            cubeApiRes = await destGatewayApiClient.uploadDeviceInformation({
                serial_number: syncedDevice.serial_number,
                third_serial_number: serial_number,
                params,
            });
            logger.info(`[sse update device info] updateDeviceState res: ${JSON.stringify(cubeApiRes)}`);
            logger.debug(`[sse update device info] updateDeviceState params: ${JSON.stringify(params)}`);

            // logger.info(`[sse update device online] updateDeviceOnline res: ${JSON.stringify(cubeApiRes)}`);
            const resError = _.get(cubeApiRes, 'error');
            const resType = _.get(cubeApiRes, 'payload.type');
            if (resError === 1000) {
                await srcTokenAndIPInvalid('ip', srcMac);
                logger.warn(`[sse update device info]  update device timeout`);
            } else if (resType === 'AUTH_FAILURE') {
                await srcTokenAndIPInvalid('token', srcMac);
                logger.warn(`[sse update device info]  update device token invalid`);
            } else if (resType === 'INVALID_PARAMETERS') {
                logger.warn(`[sse update device info]  update device info params invalid: ${JSON.stringify(payload)} \n update params : ${JSON.stringify(params)}`);
            } else {
                const { name } = payload as IDeviceInfoUpdatePayload;
                sse.send({
                    name: 'device_info_change_report',
                    data: {
                        id: serial_number,
                        name,
                        from: srcMac,
                        isSynced: true,
                        isSupported: true,
                    },
                });

                logger.info(`[sse update device info] update device success`);
            }
            return;
        }

        if (type === 'online') {
            cubeApiRes = await destGatewayApiClient.updateDeviceOnline({
                serial_number: syncedDevice.serial_number,
                third_serial_number: serial_number,
                params: payload,
            });
            logger.info(`[sse update device online] updateDeviceOnline res: ${JSON.stringify(cubeApiRes)}`);
            const resError = _.get(cubeApiRes, 'error');
            const resType = _.get(cubeApiRes, 'payload.type');
            if (resError === 1000) {
                await srcTokenAndIPInvalid('ip', srcMac);
                logger.warn(`[sse update device online]  update device timeout`);
            } else if (resType === 'AUTH_FAILURE') {
                await srcTokenAndIPInvalid('token', srcMac);
                logger.warn(`[sse update device online]  update device token invalid`);
            } else if (resType === 'INVALID_PARAMETERS') {
                logger.warn(`[sse update device online]  update device online params invalid ${JSON.stringify(payload)}`);
            } else {
                logger.info(`[sse update device online]  update device success`);
            }
            return;
        }

        if (type === 'state') {
            // 更新设备信息和状态 Update device information and status
            let deviceUpdateState = null;
            const channelNum = getSwitchChannelNum(srcDeviceData as any);
            const powerState = _.get(payload, 'power.powerState');
            if (powerState && channelNum !== 0) {
                // 适配多通道设备 Adapt to multi-channel device
                const toggle = {};
                for (let i = 1; i <= channelNum; i++) {
                    _.set(toggle, i, { toggleState: powerState });
                }
                deviceUpdateState = {
                    power: {
                        powerState,
                    },
                    toggle,
                };
            } else {
                deviceUpdateState = payload;
            }
            const params = {
                serial_number: syncedDevice.serial_number,
                third_serial_number: serial_number,
                params: {
                    state: deviceUpdateState,
                },
            };
            logger.info(`[sse update device state] uploadDeviceState params: ${JSON.stringify(params)}`);
            const uploadRes = await destGatewayApiClient.uploadDeviceState(params);
            logger.info(`[sse update device state] uploadDeviceState res: ${JSON.stringify(uploadRes)}`);

            const resError = _.get(uploadRes, 'error');
            const resType = _.get(uploadRes, 'payload.type');

            if (resError === 1000) {
                await srcTokenAndIPInvalid('ip', srcMac);
                logger.warn(`[sse update device state]  update device timeout`);
            } else if (resType === 'AUTH_FAILURE') {
                await srcTokenAndIPInvalid('token', srcMac);
                logger.warn(`[sse update device state]  update device token invalid`);
            } else if (resType === 'INVALID_PARAMETERS') {
                logger.warn(`[sse update device state]  update device params invalid ${JSON.stringify(payload)}`);
            } else {
                logger.info(`[sse update device state] update device ${serial_number} ${syncedDevice.serial_number} success`);
            }
            return;
        }
    }

    // logger.debug(`[sse delete device] updateDeviceState res error => `, JSON.stringify(cubeApiRes));
    if (cubeApiRes.error === 401) {
        await destTokenInvalid();
        logger.warn(`[sse update device error or get device error] target token invalid`);
        return;
    } else if (cubeApiRes.error === 1000) {
        logger.warn(`[sse update device error or get device info] target ip address invalid`);
        return;
    } else {
        logger.error(`[sse update device info or get device info] unknown error: ${JSON.stringify(cubeApiRes)}`);
        return;
    }
}

/**
 * @description 从同步目标网关设备缓存中删除一条数据 Delete a piece of data from the sync target gateway device cache
 * @param {IEndpoint} endpoint Cube API 返回的数据 Data returned by Cube API
 */
async function removeOneDeviceFromDestCache(endpoint: IEndpoint) {
    const destRes = await getDestGatewayDeviceGroup();
    if (destRes.error === 0) {
        const deviceList = destRes.data.device_list;
        const i = _.findIndex(deviceList, { serial_number: endpoint.serial_number });
        if (i === -1) {
            logger.warn(`[sse removeOneDeviceFromDestCache] endpoint device not found`);
        } else {
            deviceList.splice(i, 1);
            await updateDestGatewayDeviceGroup(deviceList);
        }
    } else {
        logger.warn(`[sse removeOneDeviceFromDestCache] get dest gateway device failed`);
    }
}

/**
 * @description 同步已添加设备的在线状态 Synchronize the online status of added devices
 * @param {IAddDevicePayload} device
 * @returns {*} 
 */
async function syncOneDeviceToSrcForOnline(device: IAddDevicePayload) {
    const { serial_number, tags } = device;
    const nsProAddonData = _.get(tags, ['__nsproAddonData']);
    if (!nsProAddonData) {
        logger.info(`[dest sse sync new device online] device ${serial_number} not target device`);
        return;
    }
    const { srcGatewayMac, deviceId } = nsProAddonData;
    /** 同步目标网关的 MAC 地址 Synchronize the MAC address of the target gateway */
    const destGatewayInfo = await db.getDbValue('destGatewayInfo');
    if (!destGatewayInfo) {
        logger.info(`[dest sse sync new device online] target gateway missing`);
        return;
    }
    if (!destGatewayInfo.ipValid) {
        logger.info(`[dest sse sync new device online] target gateway ip invalid`);
        return;
    }
    if (!destGatewayInfo.tokenValid) {
        logger.info(`[dest sse sync new device online] target gateway token invalid`);
        return;
    }

    const srcDeviceList = await getSrcGatewayDeviceGroup(srcGatewayMac);
    const destDeviceList = await getDestGatewayDeviceGroup();
    logger.info(`[dest sse sync new device online] srcDeviceList ${JSON.stringify(srcDeviceList)}`);
    if (srcDeviceList.error !== 0) {
        logger.info(`[dest sse sync new device online] get target device list fail ${JSON.stringify(srcDeviceList)}`);
        return;
    }

    if (destDeviceList.error !== 0) {
        logger.info(`[dest sse sync new device online] get dest device list fail ${JSON.stringify(destDeviceList)}`);
        return;
    }

    const curDestDevice = _.find(destDeviceList.data.device_list, { serial_number });
    if (!curDestDevice) {
        destDeviceList.data.device_list.push(device);
        await updateDestGatewayDeviceGroup(destDeviceList.data.device_list);
        logger.info(`[dest sse sync new device online] dest device ${serial_number} not exist in cache, added it.`);
    }

    const curSrcDevice = _.find(srcDeviceList.data.device_list, { serial_number: deviceId });
    logger.info(`[dest sse sync new device online] curSrcDevice ${JSON.stringify(curSrcDevice)}`);
    if (!curSrcDevice) {
        logger.info(`[dest sse sync new device online] device ${deviceId} not found in ${JSON.stringify(srcDeviceList)}`);
        return;
    }

    const ApiClient = CubeApi.ihostApi;
    const destGatewayApiClient = new ApiClient({ ip: destGatewayInfo.ip, at: destGatewayInfo.token });

    const updateOnlineRes = await destGatewayApiClient.updateDeviceOnline({
        serial_number,
        third_serial_number: deviceId,
        params: {
            online: curSrcDevice.online,
        },
    });
    logger.info(`[dest sse sync new device online] updateOnlineRes ${JSON.stringify(updateOnlineRes)}`);
}

/**
 * @description 筛选有效网关 Filter valid gateways
 * @param {IGatewayInfoItem[]} gateways
 * @returns {*}  {IGatewayInfoItem[]}
 */
function whichGatewayValid(gateways: IGatewayInfoItem[]): IGatewayInfoItem[] {
    const validGatewayList = gateways.flatMap((gateways) => {
        // if (gateways.ipValid === false) return [];
        if (gateways.tokenValid === false) return [];
        if (!gateways.token) return [];

        return gateways;
    });

    return validGatewayList;
}

/**
 * @description 检查sse Check sse
 * @returns {*} 
 */
async function checkForSse() {
    logger.info('[checkForSse] init all sse');
    const srcGatewayInfoList = await db.getDbValue('srcGatewayInfoList');
    const destGatewayInfo = await db.getDbValue('destGatewayInfo');
    const validGatewayList = whichGatewayValid(srcGatewayInfoList);
    logger.debug('[checkForSse] validGatewayList => ', JSON.stringify(validGatewayList));

    for (const gateway of validGatewayList) {
        const sse = srcSsePool.get(gateway.mac);
        // 没有sse的直接建立 Direct establishment without sse
        if (!sse) {
            await srcSse.buildServerSendEvent(gateway);
            continue;
        }

        srcSsePool.delete(gateway.mac);
        await srcSse.buildServerSendEvent(gateway);
    }

    if (!destGatewayInfo) {
        logger.info("[checkForSse] destGatewayInfo doesn't exist", destGatewayInfo);
        return;
    }

    if (!destGatewayInfo.tokenValid || !destGatewayInfo.ipValid) {
        logger.info('[checkForSse] dest gateway token invalid or ip invalid', destGatewayInfo);
        return;
    }

    // 目标SSE不存在或者状态不正确直接重新起新的SSE If the target SSE does not exist or the status is incorrect, directly restart a new SSE.
    if (!destSseEvent || destSseEvent.status === ESseStatus.CLOSED) {
        await destSse.buildServerSendEvent(destGatewayInfo);
        return;
    }
}


/**
 * @description 将对应来源网关的设备在线状态同步到目标网关 Synchronize the online status of the device corresponding to the source gateway to the target gateway
 * @param {IGatewayInfoItem} srcGateway
 * @returns {*}
 */
async function setDeviceOnline(srcGateway: IGatewayInfoItem) {
    const ApiClient = CubeApi.ihostApi;
    const destGatewayInfo = await db.getDbValue('destGatewayInfo');
    if (!destGatewayInfo) {
        logger.warn(`(setDeviceOnline) no destGatewayInfo`);
        return;
    }
    if (!destGatewayInfo.ipValid || !destGatewayInfo.tokenValid) {
        logger.warn(`(setDeviceOnline) dest gateway token or IP invalid`);
        return;
    }
    const destClient = new ApiClient({ ip: destGatewayInfo.ip, at: destGatewayInfo.token });

    const srcGatewayMac = srcGateway.mac;
    const dRes = await getDestGatewayDeviceGroup();
    if (dRes.error !== 0) {
        logger.warn(`(setDeviceOnline) getDestGatewayDeviceGroup failed: dRes: ${JSON.stringify(dRes)}`);
        return;
    }
    const sRes = await getSrcGatewayDeviceGroup(srcGatewayMac);
    if (sRes.error !== 0) {
        logger.warn(`(setDeviceOnline) getSrcGatewayDeviceGroup failed: sRes: ${JSON.stringify(sRes)}`);
        return;
    }
    const destGatewayDeviceList = dRes.data.device_list as GatewayDeviceItem[];
    const srcGatewayDeviceList = sRes.data.device_list as GatewayDeviceItem[];
    let cubeApiRes = null;
    logger.debug(`(setDeviceOnline) destGatewayDeviceList: ${JSON.stringify(destGatewayDeviceList)}`);
    logger.debug(`(setDeviceOnline) srcGatewayDeviceList: ${JSON.stringify(srcGatewayDeviceList)}`);
    for (const destDev of destGatewayDeviceList) {
        const tagMac = _.get(destDev, 'tags.__nsproAddonData.srcGatewayMac');
        const tagDevId = _.get(destDev, 'tags.__nsproAddonData.deviceId');
        if (tagMac === srcGatewayMac) {
            const found = _.find(srcGatewayDeviceList, { serial_number: tagDevId });
            if (found) {
                cubeApiRes = await destClient.updateDeviceOnline({
                    serial_number: destDev.serial_number,
                    third_serial_number: tagDevId,
                    params: {
                        online: true,
                    },
                });
                logger.debug(`(setDeviceOnline) updateDeviceOnline cubeApiRes: ${JSON.stringify(cubeApiRes)}`);
            } else {
                cubeApiRes = await destClient.deleteDevice(destDev.serial_number);
                logger.debug(`(setDeviceOnline) deleteDevice cubeApiRes: ${JSON.stringify(cubeApiRes)}`);
            }
        }
    }
}



/**
 * @description merge old capabilities with new one
 * @export
 * @param {ICapability[]} capabilities
 * @param {ICapability[]} newCapabilities
 * @param {boolean} [omitConfig=false] ns panel pro can only receive the configuration that can be modify, so we have to omit other capability's configuration
 * @returns {*}  {ICapability[]}
 */
export function mergeCapabilities(capabilities: ICapability[], newCapabilities: ICapability[], omitConfig = false): ICapability[] {
    return capabilities.map(capability => {
        const matchCapability = newCapabilities.find(newCapability => {
            // with same capability name and same permission
            const conditionA = capability.capability === newCapability.capability && capability.permission === newCapability.permission
            const newCapabilityName = get(newCapability, ['name']);
            if (!newCapabilityName) return conditionA;

            // some capability has name, should be match, too
            const conditionB = newCapabilityName === capability.name;
            return conditionB && conditionA;
        })

        if (matchCapability) {
            return _.merge(capability, matchCapability)
        }

        return omitConfig ? _.omit(capability, 'configuration') : capability;
    })
}

export default {
    syncOneDevice,
    deleteOneDevice,
    updateOneDevice,
    checkForSse,
    setDeviceOnline,
    syncOneDeviceToSrcForOnline,
    removeOneDeviceFromDestCache,
};
