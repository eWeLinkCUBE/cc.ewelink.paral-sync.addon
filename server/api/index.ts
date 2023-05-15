import _ from 'lodash';
import logger from '../log';
import CubeApi from '../lib/cube-api';

/**
 * eWeLink Cube API 响应
 */
export interface CubeApiResponse<T> {
    error: number;
    data: T;
    msg: string;
}

/**
 * 网关信息
 */
export interface GatewayInfo {
    ip: string;
    mac: string;
    domain: string;
}

/**
 * 网关凭证
 */
export interface GatewayToken {
    token: string;
}

/**
 * 网关设备数据
 */
export interface GatewayDeviceItem {
    serial_number: string;
    name: string;
    manufacturer: string;
    model: string;
    firmware_version: string;
    mac_address: string;
    display_category: string;
    capabilities: any;
    protocol: string;
    state: string;
    tags: any;
    online: boolean;
    subnet: boolean;
}

/**
 * 网关子设备数据
 */
export interface GatewaySubDeviceItem {
    name: string,
    third_serial_number: string;
    manufacturer: string;
    model: string;
    firmware_version: string;
    display_category: string;
    capabilities: any;
    state: any;
    tags: any;
    service_address: string;
}

/**
 * 网关子设备 endpoint
 */
export interface GatewaySubDeviceEndpoint {
    serial_number: string;
    third_serial_number: string;
}

/**
 * 网关子设备在线数据
 */
export interface GatewaySubDeviceOnlineParams {
    serial_number: string;
    third_serial_number: string;
    params: {
        online: boolean;
    };
}

/**
 * 网关子设备状态数据
 */
export interface GatewaySubDeviceStateParams {
    serial_number: string;
    third_serial_number: string;
    params: {
        state: any;
    };
}

export const ApiClient = CubeApi.ihostApi;

/**
 * 获取指定 Hostname 的网关信息
 * 如果指定网关不存在，则 error 为 -1，data 为 null
 * 否则 error 为 0，data 为网关信息
 *
 * @param host 网关的 Hostname，iHost 填写 IP (192.168.10.100)，NSPro 填写 IP 加端口号 (192.168.10.200:8080)
 */
export async function getGatewayInfo(host: string): Promise<CubeApiResponse<GatewayInfo | null>> {
    logger.info(`(api.getGatewayInfo) host: ${host}`);
    const result = {
        error: 0,
        data: null,
        msg: 'Success'
    };
    const client = new ApiClient({ ip: host });
    const res = await client.getBridgeInfo();
    if (res.error === 0) {
        result.data = res.data;
    } else {
        result.error = -1;
        result.msg = 'Timeout'
    }
    logger.info(`(api.getGatewayInfo) result: ${JSON.stringify(result)}`);
    return result;
}

/**
 * 获取指定 Hostname 的网关凭证
 * 如果请求超时，则 error 为 -1，data 为 null
 * 否则 error 为 0，data 为网关凭证
 *
 * @param host 网关的 Hostname，iHost 填写 IP (192.168.10.100)，NSPro 填写 IP 加端口号 (192.168.10.200:8080)
 * @param timeout 请求的总超时时长，单位 ms
 * @param interval 请求的间隔时长，单位 ms
 */
export async function getGatewayToken(host: string, timeout?: number, interval?: number): Promise<CubeApiResponse<GatewayToken | null>> {
    logger.info(`(api.getGatewayToken) host: ${host}, timeout: ${timeout}, interval: ${interval}`);
    const result = {
        error: 0,
        data: null,
        msg: 'Success'
    };
    const client = new ApiClient({ ip: host });
    const res = await client.getBridgeAT({ timeout, interval }) as any;
    if (res.error === 0) {
        result.data = res.data;
    } else {
        result.error = -1;
        result.msg = 'Timeout';
    }
    logger.info(`(api.getGatewayToken) result: ${JSON.stringify(result)}`);
    return result;
}

/**
 * 获取指定 API client 的设备数据
 * 如果请求超时，则 error 为 -1，data 为 null
 * 如果 client 的 token 错误，则 error 为 1，data 为 null
 * 否则 error 为 0，data 为网关设备列表
 *
 * @param client 网关 API client
 */
export async function getGatewayDeviceList(client: any): Promise<CubeApiResponse<{ device_list: GatewayDeviceItem[] } | null>> {
    logger.info(`(api.getGatewayDeviceList) client IP: ${client.getIp()}, client token: ${client.getAt()}`);
    const result = {
        error: 0,
        data: null,
        msg: 'Success'
    };
    const res = await client.getDeviceList();
    if (res.error === 0) {
        result.data = res.data;
    } else if (res.error === 401) {
        result.error = 1;
        result.msg = 'Invalid token';
    } else {
        result.error = -1;
        result.msg = 'Timeout';
    }
    logger.info(`(api.getGatewayDeviceList) result: ${JSON.stringify(result)}`);
    return result;
}

/**
 * 添加网关子设备
 * 如果请求超时，则 error 为 -1，data 为 null
 * 如果 client 的 token 错误，则 error 为 1，data 为 null
 * 如果子设备参数错误，则 error 为 2，data 为 null
 * 否则 error 为 0，data 为子设备的 endpoints 数据
 *
 * @param client 网关 API client
 * @param deviceList 网关子设备列表
 */
export async function addGatewaySubDeviceList(client: any, deviceList: GatewaySubDeviceItem[]): Promise<CubeApiResponse<{ endpoints: GatewaySubDeviceEndpoint[] } | null>> {
    logger.info(`(api.addGatewaySubDeviceList) client IP: ${client.getIp()}, client token: ${client.getAt()}, deviceList: ${JSON.stringify(deviceList)}`);
    const result = {
        error: 0,
        data: null,
        msg: 'Success'
    };
    const res = await client.syncDevices({ devices: deviceList });
    const resError = _.get(res, 'error');
    const resType = _.get(res, 'payload.type');
    const resDesc = _.get(res, 'payload.description');
    if (resError === 1000) {
        result.error = -1;
        result.msg = 'Timeout';
    } else if (resType === 'AUTH_FAILURE') {
        result.error = 1;
        result.msg = resDesc;
    } else if (resType === 'INVALID_PARAMETERS') {
        result.error = 2;
        result.msg = resDesc;
    } else {
        result.data = res.payload;
    }
    logger.info(`(api.addGatewaySubDeviceList) result: ${JSON.stringify(result)}`);
    return result;
}

export async function updateGatewaySubDeviceOnline(client: any, onlineParams: GatewaySubDeviceOnlineParams) {
    logger.info(`(api.updateGatewaySubDeviceOnline) client IP: ${client.getIp()}, client token: ${client.getAt()}, onlineParams: ${JSON.stringify(onlineParams)}`);
    const result = {
        error: 0,
        data: null,
        msg: 'Success'
    };
    const res = await client.updateDeviceOnline(onlineParams);
    console.log(res);
    if (res.error === 1000) {
        result.error = -1;
        result.msg = 'Timeout';
    }
    logger.info(`(api.updateGatewaySubDeviceOnline) result: ${JSON.stringify(result)}`);
    return result;
}

export async function updateGatewaySubDeviceState(client: any, updateParams: GatewaySubDeviceStateParams) {
    logger.info(`(api.updateGatewaySubDeviceState) `);
    const result = {
        error: 0,
        data: null,
        msg: 'Success'
    };
    const res = await client.uploadDeviceState(updateParams);
    console.log(res);
    if (res.error === 1000) {
        result.error = -1;
        result.msg = 'Timeout';
    }
    logger.info(`(api.updateGatewaySubDeviceState) result: ${JSON.stringify(result)}`);
    return result;
}

export async function updateGatewayDeviceState(client: any, serialNumber: string, updateParams: any) {
    logger.info(`(api.updateGatewayDeviceState) `);
    const result = {
        error: 0,
        data: null,
        msg: 'Success'
    };
    const res = await client.updateDeviceState(serialNumber, updateParams);
    console.log(res);
    if (res.error === 1000) {
        result.error = -1;
        result.msg = 'Timeout';
    }
    logger.info(`(api.updateGatewayDeviceState) result: ${JSON.stringify(result)}`);
    return result;
}
