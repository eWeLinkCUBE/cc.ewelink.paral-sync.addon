import getGatewayInfo from '../services/public/getGatewayInfo';
import mDnsGatewayClass from '../ts/class/mDnsGatewayClass';
import EGatewayType from '../ts/enum/EGatewayType';
import sse from '../ts/class/sse';
import tools from './tools';
import logger from '../log';

/** 获取已搜索到的局域网设备 */
function getMDnsGatewayList() {
    const arr = Array.from(mDnsGatewayClass.mDnsGatewayMap.values());
    return arr;
}

/** 局域网设备加入 */
async function setMDnsGateway(gatewayInfo: { ip: string; name: string; deviceId: string }) {
    mDnsGatewayClass.mDnsGatewayMap.set(gatewayInfo.deviceId, gatewayInfo);
    let nsProGatewayInfo = await getGatewayInfo(gatewayInfo.ip, EGatewayType.NS_PANEL_PRO);

    //防止nsPro设备刚启动时，mDns扫描到了，服务还没起来的情况
    if (!nsProGatewayInfo) {
        logger.info('get gateway info fail 1 time');
        await tools.sleep(2000);
        nsProGatewayInfo = await getGatewayInfo(gatewayInfo.ip, EGatewayType.NS_PANEL_PRO);
    }
    if (!nsProGatewayInfo) {
        logger.info('get gateway info fail 2 time');
        //接口拿不到网关信息，删除局域网mDns信息，等再次获取网关信息接口
        mDnsGatewayClass.mDnsGatewayMap.delete(gatewayInfo.deviceId);
        return;
    }

    sse.send({
        name: 'gateway_info_report',
        data: nsProGatewayInfo,
    });
}

export default {
    getMDnsGatewayList,
    setMDnsGateway,
};
