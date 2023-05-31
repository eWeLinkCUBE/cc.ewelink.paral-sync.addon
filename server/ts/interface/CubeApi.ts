// eWeLink Cube API 类型声明

/**
 * 网关设备数据
 */
export interface GatewayDeviceItem {
    /** 设备id */
    serial_number: string;
    /** 设备名称 */
    name: string;
    /** 厂商 */
    manufacturer: string;
    /** 设备产品型号 */
    model: string;
    /** 固件版本 */
    firmware_version: string;
    /** mac地址 */
    mac_address: string;
    /** 设备分类 */
    display_category: string;
    /** 能力列表 */
    capabilities: any;
    /** 设备协议 */
    protocol: string;
    /** 能力具体属性 */
    state: any;
    /** tag */
    tags: any;
    /** 是否在线 */
    online: boolean;
    subnet: boolean;
}
