import logger from '../log';
import mDnsGatewayClass from '../ts/class/mDnsGatewayClass';

/** 获取已搜索到的局域网设备 */
function getMDnsGatewayList() {
    let arr: any = Array.from(mDnsGatewayClass.gatewayMap.values());
    arr = arr.map((item: any) => {
        return {
            ip: item[0],
            ...item[1],
        };
    });
    logger.info('arr----------------------------------', arr);
    return arr as {
        deviceId: string;
        discoveryTime: number;
    }[];
}

export default {
    getMDnsGatewayList,
};
