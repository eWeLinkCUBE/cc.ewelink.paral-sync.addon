import mDns from './initMDns';
import config from '../config';

const { mDnsGapTime } = config.timeConfig;
/** mDns发起询问 */
function queryMDns() {
    mDns.query({
        questions: [
            {
                name: 'nspanelpro.local',
                type: 'A',
            },
        ],
    });
}

/** 每隔一段时间拉取一次数据 */
export default function gapTimeRun() {
    queryMDns();

    /** 一直请求局域网 */
    setInterval(() => {
        queryMDns();
    }, mDnsGapTime * 1000);
}
