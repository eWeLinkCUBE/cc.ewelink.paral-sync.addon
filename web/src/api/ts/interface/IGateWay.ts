/** 
* 获取到的网关信息
* Obtained gateway information
*/
export interface IGateWayInfoData {
    /** 
    * ip地址
    * IP address
    */
    ip: string;
    /** 
    * mac地址
    * Mac address
    */
    mac: string;
    /** 
    * 名称
    * name
    */
    name?: string;
    /** 
    * 域名
    * domain name
    */
    domain: string;
    /** 
    * 开始获取token的时间戳
    * Start getting the timestamp of the token
    */
    ts: string | number;
    /** 
    * ip是否有效
    * Is the IP valid
    */
    ipValid: boolean;
    /** 
    * 凭证是否有效
    * Is the voucher valid
    */
    tokenValid: boolean;
    /** 
    * 加密后的token
    * Encrypted token
    */
    token?: string
}

/** 
* nsPro 设备
* nsPro device
*/
export interface INsProDeviceData {
    /** 
    * 设备来源，此处为mac地址
    * Device source, here is the mac address
    */
    from: string,
    /** 
    * 设备id
    * device id
    */
    id: string,
    /** 
    * 是否同步
    * Synchronize or not
    */
    isSynced: boolean,
    /** 
    * 设备名
    * Device name
    */
    name: string,
    /** 
    * 前端加的转圈状态
    * The front-end added rotation state
    */
    spinLoading?: boolean,
    /** 
    * 是否是支持的设备
    * Is it a supported device
    */
    isSupported?: boolean,
}

export enum stepsList {
    /**
    * 第一步
    * First step
    */
    FIRST = 'first',
    /** 
    * 第二步
    * Step 2
    */
    SECOND = 'second',
    /** 
    * 第三步
    * Step 3
    */
    THIRD = 'third'
}
/** SSE子设备删除 SSE sub device deletion */
export interface IDeleteDeviceData {
    /** 
    * 设备id
    * Device id
    */
    deviceId: string,
    /**
    * 设备来源网关的mac地址
    * The mac address of the device source gateway
    */
    mac: string
}

/** SSE新增子设备 SSE adds new sub-device*/
export interface IAddDeviceData {
    /** 
    * 设备名
    * Device name
    */
    name: string;
    /** 
    * 设备id
    * Device id
    */
    id: string;
    /** 
    * 设备来源，此处为mac地址
    * Device source, here is the mac address
    */
    from: string;
    /** 
    * 是否同步
    * Synchronize or not
    */
    isSynced: boolean;
    /** 
    * 前端加的转圈状态
    * The front-end added rotation state
    */
    spinLoading?: boolean,
}
