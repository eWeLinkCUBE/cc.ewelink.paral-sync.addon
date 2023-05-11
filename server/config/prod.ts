export const prodConf = {
    nodeApp: {
        env: 'prod',
        port: 8321,
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
        appId: '',
        appSecret: '',
    },
    timeConfig: {
        mDnsGapTime: 30, //s
    },
    iHost: {
        api: 'http://ihost/open-api/v1/rest',
    },
    nsPro: {
        api: 'http://nspanelpro.local/open-api/v1/rest',
    },
    log: {
        path: 'log/logFile/total_prod.log',
        pattern: '-yyyy-MM-dd.log',
    },
    /** 启动的ip */
    localIp: 'http://ihost:8322',
};
