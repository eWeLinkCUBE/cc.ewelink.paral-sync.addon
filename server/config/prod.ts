export const prodConf = {
    nodeApp: {
        env: 'prod',
        port: 8322,
        dataPath: '',
        dbPath: '',
        name: 'Paral-Sync',
        version: '0.0.1',
    },
    auth: {
        appId: 'DP1ydXVV50xwj9Pi',
        appSecret: 'gHDu79PCw*yR%wtfmy5YUzo!yknm74xz',
    },
    iHost: {
        ip: 'ihost',
    },
    log: {
        path: 'log/logFile/total_prod.log',
        pattern: '-yyyy-MM-dd.log',
    },
    /** 
    * 启动的ip
    * startup ip
    */
    localIp: 'http://ihost:8322',
    /** 
    * 获取网关凭证的等待时长 (ms) 
    * Waiting time to obtain gateway credentials (ms)
    */
    getGatewayTokenTimeout: 300000,
};
