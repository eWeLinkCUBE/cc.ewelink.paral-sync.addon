import makeMDns from 'multicast-dns';
import _ from 'lodash';
import logger from '../log';

const mDns = makeMDns();

mDns.on('response', (response: any) => {
    const { answers, additionals } = response;
    if (!Array.isArray(answers)) return;
    const responseDataList = [...answers, ...additionals];

    if (responseDataList.length === 0) return;

    const reg = RegExp(/NSPanelPro.local/gi);
    const gatewayInfo = {
        ip: '',
        name: '',
    };

    for (const item of responseDataList) {
        if (item.type !== 'A') {
            continue;
        }
        if (reg.test(`${item.name}`)) {
            gatewayInfo.ip = item.data;
            gatewayInfo.name = item.name;
        }
    }

    // const { ip, name } = gatewayInfo;
});

export default mDns;
