/** 接口路径 */
enum EApiPath {
    /** 1、获取本机网关信息 */
    GET_TO_GATEWAY_INFO = '/gateway',
    /** 2、通过ip获取相关网关信息 */
    GET_TO_GATEWAY_INFO_BY_IP = '/gateway/:ip',
    /** 3、获取iHost/NSPanelPro凭证 */
    GET_GATEWAY_TOKEN = '/token/:mac',
    /** 4、获取局域网内的iHost及NsPanelPro设备 */
    GET_FROM_GATEWAY_DEVICES = '/gateways',
    /** 5、获取所有网关下设备信息 */
    GET_FROM_GATEWAY_SUB_DEVICE = '/devices',
}

export default EApiPath;
