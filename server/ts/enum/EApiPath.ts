/** 接口路径 */
enum EApiPath {
    /** 1、获取本机网关信息 */
    GET_TARGET_GATEWAY_INFO = '/gateway',
    /** 2、通过ip获取相关网关信息 */
    GET_TARGET_GATEWAY_INFO_BY_IP = '/gateway/:ip',
    /** 3、获取iHost/NSPanelPro凭证 */
    GET_GATEWAY_TOKEN = '/token/:mac',
    /** 4、获取局域网内的iHost及NsPanelPro设备 */
    GET_SOURCE_GATEWAY_IN_LAN = '/gateways',
    /** 5、 获取所有网关下的子设备 */
    GET_SOURCE_GATEWAY_SUB_DEVICE = '/devices/:mac',
    /** 6、 同步单个设备 */
    SYNC_ONE_DEVICE = '/device/:deviceId/sync',
    /** 7、 同步所有设备 */
    SYNC_ALL_DEVICES = '/devices/sync',
    /** 8、 开关新增设备自动同步 */
    CHANGE_IS_AUTO_SYNC_STATUS = '/auto-sync',
}

export default EApiPath;
