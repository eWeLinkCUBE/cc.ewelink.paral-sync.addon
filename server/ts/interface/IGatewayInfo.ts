interface IGatewayInfo {
    /** ip地址 */
    ip: string;
    /** mac地址 */
    mac: string;
    /** 名称 */
    name: string;
    /** 域名 */
    domain: string;
    /** 开始获取token的时间戳，若无获取则为空 */
    ts: string;
    /** 是否获取到凭证 */
    gotToken: boolean;
}

export default IGatewayInfo;
