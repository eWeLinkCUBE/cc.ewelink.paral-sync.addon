// eWeLink Cube API 类型声明

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
