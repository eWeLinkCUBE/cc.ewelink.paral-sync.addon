import makeMdns from 'multicast-dns';
import type { IMdnsRes } from '../ts/interface/IMdns';
import mDnsDataParse from './mDnsDataParse';
import _ from 'lodash';
import deviceMapUtil from './deviceMapUtil';
import logger from '../log';

const mdns = makeMdns();

mdns.on('response', (response: any) => {
    const { answers, additionals } = response;
    if (!Array.isArray(answers)) return;
    const responseDataList = [...answers, ...additionals];

    if (responseDataList.length === 0) return;
    let aDeviceDomain = ''; //a记录里的域名，包含设备id
    let aIp = ''; //a记录里的ip
    const reg = RegExp(/eWeLink_/gi);
    const tmp = {} as IMdnsRes;
    for (const item of responseDataList) {
        const data = item.data;

        switch (item.type) {
            case 'PTR':
                if (!reg.test(`${data}`)) {
                    //不用return，因为设备可能上报多个ptr，导致正确的ptr都被忽略掉
                    continue;
                }
                tmp.ptr = data;
                break;
            case 'A':
                tmp.a = data;
                aDeviceDomain = item.name;
                aIp = data;
                break;
            case 'SRV':
                tmp.srv = data;
                break;
            case 'TXT':
                const arr = data.toString().split(/(?<!\{.*),(?!\}.*)/);
                const txtData: any = {};
                arr.map((str: string) => {
                    const [key, value] = str.split('=');
                    try {
                        txtData[key] = JSON.parse(value);
                    } catch {
                        txtData[key] = value;
                    }
                });
                tmp.txt = txtData;
                // deviceId = txtData.id;
                break;
            default:
                break;
        }
    }
    if (aDeviceDomain && aIp) {
        deviceMapUtil.updateAData(aDeviceDomain, aIp);
    }

    const params = parseParams(tmp);

    if (!params || !params.deviceId) {
        return;
    }

    //如果设备（例如UIID 77,uiid 181）没有ip，有target，查询一次mDns的 A 类型
    if (params && !params.ip && params.target) {
        deviceMapUtil.mDnsQueryA(params.deviceId, params.target);
    }

    // 如果ip不存在说明该设备可能不支持局域网
    if (!params || (!params.ip && !params.target)) {
        // logger.error(`no lan device --------------: ${params?.deviceId}`);
        return;
    }
});

//整理收到的数据
const parseParams = (device: IMdnsRes) => {
    const { ptr, txt, a, srv } = device;
    const data1 = _.get(txt, 'data1', '');
    const data2 = _.get(txt, 'data2', '');
    const data3 = _.get(txt, 'data3', '');
    const data4 = _.get(txt, 'data4', '');

    try {
        // ptr: 'eWeLink_1001033e54._ewelink._tcp.local',取出设备id,补充：有可能是eWelink_1001033e54
        const deviceId = ptr.split('.')[0].split(/eWeLink_/gi)[1];
        return {
            deviceId,
            type: txt.type,
            encryptedData: `${data1}${data2}${data3}${data4}`,
            ip: a,
            port: srv.port,
            target: srv.target,
            iv: mDnsDataParse.decryptionBase64(txt.iv),
        };
    } catch (error) {
        return null;
    }
};

export default mdns;
