interface IGatewayInfo {
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
    name: string;
    /** 
    * 域名
    * domain
    */
    domain: string;
    /** 
    * 开始获取token的时间戳，若无获取则为空
    * The timestamp when the token was started to be obtained. If no token was obtained, it will be empty.
    */
    ts: string;
    /** 
    * 是否获取到凭证
    * Whether the certificate was obtained
    */
    gotToken: boolean;
}

export default IGatewayInfo;
