/** 接口路径 api path */
enum EApiPath {
    /** 
    * 获取本机网关信息
    * Obtain local gateway information
    */
    GET_TARGET_GATEWAY_INFO = '/gateway',
    /** 
    * 通过ip获取相关网关信息
    * Obtain relevant gateway information through IP
    */
    GET_TARGET_GATEWAY_INFO_BY_IP = '/gateway/:ip',
    /** 
    * 获取iHost/NSPanelPro凭证
    * Obtain iHost/ns panel pro certificate
    */
    GET_GATEWAY_TOKEN = '/token/:mac',
    /** 
    * 获取局域网内的iHost及NsPanelPro设备
    * Obtain the iHost and ns panel pro devices in the LAN
    */
    GET_SOURCE_GATEWAY_IN_LAN = '/gateways',
    /** 
    * 获取所有网关下的子设备
    * Get all sub-devices under the gateway
    */
    GET_SOURCE_GATEWAY_SUB_DEVICE = '/devices/:mac',
    /** 
    * 同步单个设备
    * Synchronize a single device
    */
    SYNC_ONE_DEVICE = '/device/:deviceId/sync',
    /** 
    * 同步所有设备
    * Sync all devices
    */
    SYNC_ALL_DEVICES = '/devices/sync',
    /** 
    * 取消同步单个设备
    * Unsync a single device
    */
    UNSYNC_ONE_DEVICE = '/device/:deviceId/un-sync',
    /** 
    * 删除指定网关
    * Delete the specified gateway
    */
    DELETE_GATEWAY = '/gateway/:mac',
    /** 
    * 开关新增设备自动同步 
    * Switch automatic synchronization of new devices
    */
    CHANGE_IS_AUTO_SYNC_STATUS = '/auto-sync',
    /** 
    * iHost 控制设备回调
    * iHost control device callback
    */
    OPEN_CONTROL_DEVICE = '/open/device/:deviceId',
    /** 
    * 获取设备自动同步开关状态
    * Get the device automatic synchronization switch status
    */
    GET_AUTO_SYNC_STATUS = '/auto-sync',
    /**
    * sse
    * sse
    */
    SSE = '/sse',
}

export default EApiPath;
