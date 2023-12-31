import { request } from '../public';
import type { IGateWayInfoData, INsProDeviceData } from '@/api/ts/interface/IGateWay';
import EReqMethod from '../ts/enum/EReqMethod';


/**
 * 获取网关token
 * Get gateway token
 */
async function getToken(mac: string, isSyncTarget: number) {
    return await request<IGateWayInfoData>(`/token/${mac}`, { isSyncTarget }, EReqMethod.GET);
}

/**
 * 通过ip获取网关信息
 * Get gateway information through ip
*/
async function linkNsProGateWay(ip: string) {
    return await request<IGateWayInfoData>(`/gateway/${ip}`, {}, EReqMethod.GET);
}

/**
 * 获取本机网关信息
 * Get local gateway information
 */
async function getOurselfGateWayInfo() {
    return await request<IGateWayInfoData>(`/gateway`, {}, EReqMethod.GET);
}

/**
 * 获取所有的nsPro网关信息
 * Get all ns pro gateway information
 */
async function getNsProGateWayList() {
    return await request<IGateWayInfoData[]>(`/gateways`, {}, EReqMethod.GET);
}

/**
 * 获取nsPro网关下的子设备
 * Get the sub-device under ns pro gateway
 */
async function getDeviceList(mac: string,isForceRefresh:string) {
    return await request<INsProDeviceData[]>(`/devices/${mac}`, {forceSrc:isForceRefresh}, EReqMethod.GET);
}

/**
 * 同步单个设备
 * Sync a single device
 */
async function syncSingleDevice(deviceId: string, from: string) {
    return await request<any>(`/device/${deviceId}/sync`, { from }, EReqMethod.POST);
}

/**
 * 取消同步单个设备
 * Unsync a single device
 */
async function cancelSyncSingleDevice(deviceId: string, from: string) {
    return await request(`/device/${deviceId}/un-sync`, { from }, EReqMethod.DELETE);
}

/**
 * 自动同步新设备
 * Automatically sync new devices
 */
async function autoSync(params: { autoSync: boolean }) {
    return await request(`/auto-sync`, params, EReqMethod.POST);
}

/**
 * 获取自动同步新设备状态
 * Get automatic synchronization of new device status
 */
async function getAutoSyncState() {
    return await request<{ autoSync: boolean }>(`/auto-sync`, {}, EReqMethod.GET);
}

/**
 * 同步所有设备
 * Sync all devices
 */
async function syncAllDevice() {
    return await request<{syncDeviceIdList:string[]}>(`/devices/sync`, {}, EReqMethod.POST);
}

export default {
    getDeviceList,
    syncSingleDevice,
    cancelSyncSingleDevice,
    getAutoSyncState,
    autoSync,
    getToken,
    syncAllDevice,
    linkNsProGateWay,
    getOurselfGateWayInfo,
    getNsProGateWayList,
};
