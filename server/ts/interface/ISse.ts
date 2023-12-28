import { ECategory } from "../../lib/cube-api";
import { ICapability } from "../../lib/cube-api/ts/interface/IDevice";
import { IEndpoint } from "../../lib/cube-api/ts/interface/IThirdParty";
// import ECapability from "../enum/ECapability";
import { IHostStateInterface } from "./IHostState";

export interface IAddDevice {
    payload: IAddDevicePayload;
}

export interface IAddDevicePayload {
    /** 
    * 设备id
    * Device id
    */
    serial_number: string;
    /** 
    * 第三方设备id
    * Third party device id
    */
    third_serial_number: string;
    /** 
    * 设备名称
    * Device name
    */
    name: string;
    /** 
    * 厂商
    * Manufacturer
    */
    manufacturer: string;
    /** 
    * 设备产品型号
    * Device product model
    */
    model: string;
    /** 
    * 固件版本
    * Firmware version
    */
    firmware_version: string;
    /** 
    * 设备分类
    * Device classification
    */
    display_category: ECategory;
    /** 
    * 能力列表
    * Capability list
    */
    capabilities: ICapability[];
    /** 
    * 设备协议
    * Device protocol
    */
    protocol: 'zigbee' | 'onvif' | 'rtsp' | 'esp32-cam';
    /** 
    * 能力具体属性
    * Capability specific attributes
    */
    state: any;
    /** tag */
    tags: any;
    /** 
    * 是否在线
    * Is online
    */
    online: boolean;
}

// interface Capability {
//     /** 设备能力 */
//     capability: string;
//     /** 能力是否允许读写 */
//     permission: 'readWrite' | 'read' | 'write';
// }


export interface IDeviceStateUpdate {
    /** 
    * 更新源信息
    * Update source information
    */
    endpoint: IEndpoint;
    /** 
    * 能力更新数据
    * Capability update data
    */
    payload: IHostStateInterface;
}


export interface IDeviceInfoUpdate {
    /** 
    * 更新源信息
    * Update source information
    */
    endpoint: IEndpoint;
    /** 
    * 能力更新数据
    * Capability update data
    */
    payload: IDeviceInfoUpdatePayload;
}

export interface IDeviceInfoUpdatePayload {
    name: string;
    capabilities?: any[];
    tags?: any;
}

export interface IDeviceDeleted {
    /** 
    * 更新源信息
    * Update source information
    */
    endpoint: IEndpoint;
}

export interface IDeviceOnOrOffline {
    /** 
    * 更新源信息
    * Update source information
    */
    endpoint: IEndpoint;
    /** 
    * 能力更新数据
    * Capability update data
    */
    payload: IDeviceOnOrOfflinePayload;
}

export interface IDeviceOnOrOfflinePayload {
    /** 
    * 是否在线
    * Is online
    */
    online: boolean;
}
