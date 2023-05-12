/** 错误码 */
enum EErrorCode {
    /** addon不在iHost中 */
    ADDON_NO_IN_IHOST = 1001,
    /** ip无法连接 */
    IP_CAN_NOT_CONNECT = 1101,
    /** 网关没凭证 */
    GATEWAY_NOT_TOKEN = 1401,
}

export default EErrorCode;
