import getGatewayInfo from '../services/public/getGatewayInfo';
import mDnsGatewayClass from '../ts/class/mDnsGatewayClass';
import EGatewayType from '../ts/enum/EGatewayType';
import destSse from '../ts/class/destSse';

/** 获取已搜索到的局域网设备 */
function getMDnsGatewayList() {
    const arr = Array.from(mDnsGatewayClass.mDnsGatewayMap.values());
    return arr;
}

/** 局域网设备加入 */
async function setMDnsGateway(gatewayInfo: { ip: string; name: string; deviceId: string }) {
    mDnsGatewayClass.mDnsGatewayMap.set(gatewayInfo.deviceId, gatewayInfo);
    const nsProGatewayInfo = await getGatewayInfo(gatewayInfo.ip, EGatewayType.NS_PANEL_PRO);
    if (!nsProGatewayInfo) {
        return;
    }
    destSse.send({
        name: 'gateway_info_report',
        data: nsProGatewayInfo,
    });
}

export default {
    getMDnsGatewayList,
    setMDnsGateway,
};
