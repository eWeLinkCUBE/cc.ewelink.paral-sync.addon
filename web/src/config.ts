import EEnv from '../src/ts/enum/EEnv';

const isTestEnv = () => import.meta.env.DEV;
/** 环境 */
const env = isTestEnv() ? EEnv.TEST : EEnv.PROD;

/** 调试用ip */
const NSPanelProIp = isTestEnv() ? '192.168.31.180' : 'localhost';
/** 版本(从.env文件获取) */
const version = import.meta.env.VITE_VERSION;

/** 请求 baseURL */
const apiUrl = `http://${NSPanelProIp}:8322/api/v1`;

// 请求用ak/sk
const TEST_APPID = 'DP1ydXVV50xwj9Pi';
const TEST_SECRET = 'gHDu79PCw*yR%wtfmy5YUzo!yknm74xz';
const PROD_APPID = 'DP1ydXVV50xwj9Pi';
const PROD_SECRET = 'gHDu79PCw*yR%wtfmy5YUzo!yknm74xz';
const appId = isTestEnv() ? TEST_APPID : PROD_APPID;
const appSecret = isTestEnv() ? TEST_SECRET : PROD_SECRET;
const sseUrl = isTestEnv() ? `//${NSPanelProIp}:8322/api/v1/sse` : '/api/v1/sse';

console.log(`当前版本为 ${version}`);

export { apiUrl, appSecret, appId, env ,sseUrl};
