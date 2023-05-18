import { IHostStateInterface } from "./IHostState";

export interface IAddDevice {
    payload: IAddDevicePayload;
}

export interface IAddDevicePayload {
    /** 设备id */
    serial_number: string;
    /** 第三方设备id */
    third_serial_number: string;
    /** 设备名称 */
    name: string;
    /** 厂商 */
    manufacturer: string;
    /** 设备产品型号 */
    model: string;
    /** 固件版本 */
    firmware_version: string;
    /** 设备分类 */
    display_category: string;
    /** 能力列表 */
    capabilities: Capability[];
    /** 设备协议 */
    protocol: 'zigbee' | 'onvif' | 'rtsp' | 'esp32-cam';
    /** 能力具体属性 */
    state: IHostStateInterface;
    /** tag */
    tags: Object;
    /** 是否在线 */
    online: boolean;
}

interface Capability {
    /** 设备能力 */
    capability: string;
    /** 能力是否允许读写 */
    permission: 'readWrite' | 'read' | 'write';
}


export interface IDeviceStateUpdate {
    /** 更新源信息 */
    endpoint: Endpoint;
    /** 能力更新数据 */
    payload: IHostStateInterface;
}

export interface Endpoint {
    /** 设备id */
    serial_number: string;
    /** 第三方设备id */
    third_serial_number: string;
}


export interface IDeviceInfoUpdate {
    /** 更新源信息 */
    endpoint: Endpoint;
    /** 能力更新数据 */
    payload: IDeviceInfoUpdatePayload;
}

export interface IDeviceInfoUpdatePayload {
    /** 设备名称 */
    name: string;
}

export interface IDeviceDeleted {
    /** 更新源信息 */
    endpoint: Endpoint;
}

export interface IDeviceOnOrOffline {
    /** 更新源信息 */
    endpoint: Endpoint;
    /** 能力更新数据 */
    payload: IDeviceOnOrOfflinePayload;
}

export interface IDeviceOnOrOfflinePayload {
    /** 设备是否上下线 */
    online: boolean;
}