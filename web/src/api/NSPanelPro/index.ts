import { request } from '../public';
import type { IGateWayInfoData , INsProDeviceData} from '@/api/ts/interface/IGateWay';
import EReqMethod from '../ts/enum/EReqMethod';

/**
 * 获取网关token
 */
async function getToken(mac:string,isSyncTarget:number){
    return await request<IGateWayInfoData>(`/token/${mac}`,{isSyncTarget}, EReqMethod.GET);
}

/**通过ip获取网关信息 接口暂无*/
async function linkNsProGateWay(ip: string) {
    return await request<IGateWayInfoData>(`/gateway/${ip}`, {}, EReqMethod.GET);
}

/**
 * 获取本机网关信息
 */
async function getOurselfGateWayInfo() {
    return await request<IGateWayInfoData>(`/gateway`, {}, EReqMethod.GET);
}

/**
 * 获取所有的nsPro
 */
async function getNsProGateWayInfo() {
    return await request<IGateWayInfoData[]>(`/gateways`, {}, EReqMethod.GET);
}

/**
 * 获取所有网关下的子设备
 */
async function getDeviceList(mac: string) {
    return await request<INsProDeviceData[]>(`/devices/${mac}`, {}, EReqMethod.GET);
}

/**
 * 同步单个设备
 */
async function syncSingleDevice(deviceId: string, from: string) {
    return await request<any>(`/device/${deviceId}/sync`, { from }, EReqMethod.POST);
}

/**
 * 取消同步单个设备
 */
async function cancelSyncSingleDevice(deviceId: string,from:string) {
    return await request(`/device/${deviceId}/un-sync`, {from}, EReqMethod.DELETE);
}

/**
 * 自动同步新设备
 */
async function autoSync(params: { autoSync: boolean }) {
    return await request(`/auto-sync`, params, EReqMethod.POST);
}

/**
 * 获取自动同步新设备状态
 */
async function getAutoSyncState() {
    return await request<{ autoSync: boolean }>(`/auto-sync`, {}, EReqMethod.GET);
}

/**
 * 自动同步所有设备
 */
async function syncAllDevice() {
    return await request(`/device/sync`, {}, EReqMethod.POST);
}

/**
 * 取消同步所有设备
 */
async function cancelSyncAllDevice() {
    return await request(`/device`, {}, EReqMethod.DELETE);
}

/**
 * 取消同步单个设备
 */
async function autoSyncAllDevice(state: boolean) {
    return await request(`/device/sync-status`, { autoSyncStatus: state }, EReqMethod.PUT);
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
    getNsProGateWayInfo,
    cancelSyncAllDevice
};
