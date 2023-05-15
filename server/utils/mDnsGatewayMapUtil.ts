import logger from '../log';
import mDnsGatewayClass from '../ts/class/mDnsGatewayClass';

/** 获取已搜索到的局域网设备 */
function getMDnsGatewayList() {
    const arr = Array.from(mDnsGatewayClass.mDnsGatewayMap.values());
    return arr;
}

export default {
    getMDnsGatewayList,
};
