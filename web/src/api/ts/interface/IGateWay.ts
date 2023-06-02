/** 获取到的网关信息 */
export interface IGateWayInfoData{
    /** ip地址 */
    ip: string;
    /** mac地址 */
    mac: string;
    /** 名称 */
    name?: string;
    /** 域名 */
    domain: string;
    /** 开始获取token的时间戳 */
    ts: string | number;
    /** ip是否有效 */
    ipValid: boolean;
    /** 凭证是否有效 */
    tokenValid: boolean;
    /** 加密后的token */
    token?:string
}

/** nsPro 设备 */
export interface INsProDeviceData{
    /** 设备来源 */
    from:string,
    /** 设备id */
    id:string,
    /** 是否同步 */
    isSynced:boolean,
    /** 设备名 */
    name:string,
    /** 前端加的转圈状态  */
    spinLoading?:boolean,
    /** 是否是支持的设备 */
    isSupported?:boolean,
}

export enum stepsList{
    /**第一步 */
    FIRST = 'first',
    /** 第二步 */
    SECOND ='second',
    /** 第三步 */
    THIRD = 'third'
}
/** SSE子设备删除 */
export interface IDeleteDeviceData {
    /** 设备id */
    deviceId: string,
    /** 设备来源网关的mac地址 */
    mac: string
}

/** SSE新增子设备 */
export interface IAddDeviceData{
    /** 设备名称 */
    name: string;
    /** 设备id */
    id: string;
    /** 设备来源，此处为mac地址 */
    from: string;
    /** 设备是否已同步 */
    isSynced: boolean;
    /** 转圈loading */
    spinLoading?:boolean,
}
