// eWeLink Cube API 类型声明 eWeLink Cube API type declaration

/**
 * 网关设备数据
 * Gateway device data
 */
export interface GatewayDeviceItem {
    /** 
    * 设备id
    * device id
    */
    serial_number: string;
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
    * mac地址
    * Mac address
    */
    mac_address: string;
    /** 
    * 设备分类 
    * Device classification 
    */
    display_category: string;
    /** 
    * 能力列表
    * Capability list
    */
    capabilities: any;
    /** 
    * 设备协议
    * Device protocol
    */
    protocol: string;
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
    subnet: boolean;
}
