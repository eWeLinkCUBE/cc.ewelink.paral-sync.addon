export const devConf = {
    nodeApp: {
        env: 'env',
        port: 8322,
        dataPath: '',
        dbPath: '',
        name: 'ewelink-nspanel-pro',
        version: '0.0.1',
    },
    coolKit: {
        appId: '',
        appSecret: '',
    },
    auth: {
        appId: 'DP1ydXVV50xwj9Pi',
        appSecret: 'gHDu79PCw*yR%wtfmy5YUzo!yknm74xz',
    },
    timeConfig: {
        mDnsGapTime: 30, //s
    },
    iHost: {
        api: 'http://192.168.31.116/open-api/v1/rest',
    },
    nsPro: {
        api: 'http://nspanelpro.local/open-api/v1/rest',
    },
    log: {
        path: 'log/logFile/total_dev.log',
        pattern: '-yyyy-MM-dd.log',
    },
    /** 启动的ip */
    localIp: 'http://192.168.31.194:8322',
    /** 获取网关凭证的等待时长 */
    getGatewayTokenTimeout: 300000,
};
