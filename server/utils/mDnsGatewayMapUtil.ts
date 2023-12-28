import getGatewayInfo from '../services/public/getGatewayInfo';
import mDnsGatewayClass from '../ts/class/mDnsGatewayClass';
import EGatewayType from '../ts/enum/EGatewayType';
import sse from '../ts/class/sse';
import tools from './tools';
import logger from '../log';
import db from './db';

/**
 * @description 获取已搜索到的局域网设备 Get the searched LAN devices
 * @returns {*} 
 */
function getMDnsGatewayList() {
    const arr = Array.from(mDnsGatewayClass.mDnsGatewayMap.values());
    return arr;
}
interface IGatewayInfo {
    ip: string;
    name: string;
    deviceId: string;
}

/**
 * @description 局域网设备加入 LAN device joining
 * @param {IGatewayInfo} gatewayInfo
 * @returns {*} 
 */
async function setNewMDnsGateway(gatewayInfo: IGatewayInfo) {
    mDnsGatewayClass.mDnsGatewayMap.set(gatewayInfo.deviceId, gatewayInfo);
    let nsProGatewayInfo = await getGatewayInfo(gatewayInfo.ip, EGatewayType.NS_PANEL_PRO, gatewayInfo.deviceId);

    if (typeof nsProGatewayInfo === 'number') {
        logger.info('ip not valid when get gateway info-------');
        return;
    }

    // 防止nsPro设备刚启动时，mDns扫描到了，服务还没起来的情况 Prevent the situation where mdns is scanned and the service is not started when the ns pro device is just started.
    if (!nsProGatewayInfo) {
        logger.info('get gateway info fail 1 time');
        await tools.sleep(2000);
        nsProGatewayInfo = await getGatewayInfo(gatewayInfo.ip, EGatewayType.NS_PANEL_PRO);
    }
    if (!nsProGatewayInfo) {
        logger.info('get gateway info fail 2 time');
        // 接口拿不到网关信息，删除局域网mDns信息，等再次获取网关信息接口 The interface cannot get the gateway information, delete the LAN m dns information, and wait to obtain the gateway information interface again.
        mDnsGatewayClass.mDnsGatewayMap.delete(gatewayInfo.deviceId);
        return;
    }

    sse.send({
        name: 'gateway_info_report',
        data: nsProGatewayInfo,
    });
}

/**
 * @description 更新已存在的网关信息，ip Update existing gateway information, IP
 * @param {IGatewayInfo} gatewayInfo
 */
async function updateMDnsGateway(gatewayInfo: IGatewayInfo) {
    mDnsGatewayClass.mDnsGatewayMap.set(gatewayInfo.deviceId, gatewayInfo);
    let srcGatewayInfoList = await db.getDbValue('srcGatewayInfoList');
    srcGatewayInfoList = srcGatewayInfoList.map((item) => {
        if (item.deviceId === gatewayInfo.deviceId) {
            item.ip = gatewayInfo.ip + ':8081';
            item.ipValid = true;
        }
        return item;
    });
    logger.info('update---------------------mdns-------------db', JSON.stringify(srcGatewayInfoList));
    await db.setDbValue('srcGatewayInfoList', srcGatewayInfoList);
}

export default {
    getMDnsGatewayList,
    setNewMDnsGateway,
    updateMDnsGateway,
};
