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
    /** 加密后凭证 */
    token: string;
    /** ip是否有效 */
    ipValid: boolean;
    /** 凭证是否有效 */
    tokenValid: boolean;
    /** 获取token的时间 */
    countDownTime?:number,
}

export interface INsProDeviceData{
    from:string,
    id:string,
    isSynced:boolean,
    name:string,
    spinLoading?:boolean,
}

export enum stepsList{
    /**第一步 */
    FIRST='first',
    /** 第二步 */
    SECOND='second',
}
