import { IHostStateInterface } from "../ts/interface/IHostState";
import type { IAddDevicePayload, IDeviceInfoUpdatePayload, IDeviceOnOrOfflinePayload } from "../ts/interface/ISse";


type IUpdateOneDevice = IUpdateDeviceSate | IUpdateInfoSate | IUpdateOnlineSate

interface IUpdateDeviceSate {
    type: "state";
    payload: IHostStateInterface;
}


interface IUpdateInfoSate {
    type: "state";
    payload: IDeviceInfoUpdatePayload;
}


interface IUpdateOnlineSate {
    type: "state";
    payload: IDeviceOnOrOfflinePayload;
}



/**
 * @description 同步一个设备
 * @param {IAddDevicePayload} payload
 */
async function syncOneDevice(payload: IAddDevicePayload) {
    // TODO 同步一个设备
}



/**
 * @description 删除一个设备
 * @param {IAddDevicePayload} payload
 */
async function deleteOneDevice(payload: IAddDevicePayload) {
    // TODO 删除一个设备

}


/**
 * @description 更新设备信息
 * @param {IAddDevicePayload} payload
 */
async function updateOneDevice(params: IUpdateOneDevice) {
    const { type, payload } = params;
}





export default {
    syncOneDevice,
}