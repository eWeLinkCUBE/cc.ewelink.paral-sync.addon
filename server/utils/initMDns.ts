import makeMDns from 'multicast-dns';
import _ from 'lodash';
import logger from '../log';
import mDnsGatewayClass from '../ts/class/mDnsGatewayClass';
import mDnsGatewayMapUtil from './mDnsGatewayMapUtil';

const mDns = makeMDns();

mDns.on('query', function (query) {
    console.log('got a query packet:', query);
});

mDns.on('response', (response: any) => {
    const { answers, additionals } = response;
    if (!Array.isArray(answers)) return;
    const responseDataList = [...answers, ...additionals];

    if (responseDataList.length === 0) return;

    const reg = RegExp(/NSPanelPro.local/gi);
    const gatewayInfo = {
        ip: '',
        name: '',
        deviceId: '',
    };

    const isExistNsPro = responseDataList.some((item) => reg.test(`${item.name}`));

    if (!isExistNsPro) {
        return;
    }

    for (const item of responseDataList) {
        switch (item.type) {
            case 'PTR':
                gatewayInfo.deviceId = item.data.split('.')[0].split(/eWeLink_/gi)[1];
                break;
            case 'A':
                gatewayInfo.ip = item.data;
                gatewayInfo.name = item.name;
                break;
            default:
                break;
        }
    }

    if (!gatewayInfo.ip || !gatewayInfo.name || !gatewayInfo.deviceId) {
        return;
    }
    const mDnsGatewayList = mDnsGatewayMapUtil.getMDnsGatewayList();
    const isExistInMdns = mDnsGatewayList.some((item) => item.deviceId === gatewayInfo.deviceId && item.ip === gatewayInfo.ip);
    if (isExistInMdns) {
        return;
    }
    mDnsGatewayMapUtil.setMDnsGateway(gatewayInfo);

    logger.info('responseDataList--------------------------------------------------------', responseDataList);

    logger.info('gatewayInfo--------------------------------------------------------', gatewayInfo);
});

export default mDns;
