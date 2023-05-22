import getGatewayInfo from '../services/public/getGatewayInfo';
import logger from '../log';
import mDnsGatewayClass from '../ts/class/mDnsGatewayClass';
import EGatewayType from '../ts/enum/EGatewayType';
import ownSse from '../ts/class/ownSse';

/** 获取已搜索到的局域网设备 */
function getMDnsGatewayList() {
    const arr = Array.from(mDnsGatewayClass.mDnsGatewayMap.values());
    return arr;
}

/** 局域网设备加入 */
async function setMDnsGateway(gatewayInfo: { ip: string; name: string; deviceId: string }) {
    mDnsGatewayClass.mDnsGatewayMap.set(gatewayInfo.deviceId, gatewayInfo);
    logger.info('sse 2--------------------------------------------------------');
    const nsProGatewayInfo = await getGatewayInfo(gatewayInfo.ip, EGatewayType.NS_PANEL_PRO);
    logger.info('sse 3--------------------------------------------------------');
    ownSse.send({
        name: 'gateway_info_report',
        data: nsProGatewayInfo,
    });
}

export default {
    getMDnsGatewayList,
    setMDnsGateway,
};
