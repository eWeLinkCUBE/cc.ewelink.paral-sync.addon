import logger from '../log';
import mDnsGatewayClass from '../ts/class/mDnsGatewayClass';

/** 获取已搜索到的局域网设备 */
function getMDnsGatewayList() {
    let arr = Array.from(mDnsGatewayClass.mDnsGatewayMap.values());
    arr = arr.map((gatewayInfo: any) => {
        const { ip, name } = gatewayInfo;
        return {
            ip,
            name,
        };
    });
    return arr;
}

export default {
    getMDnsGatewayList,
};
