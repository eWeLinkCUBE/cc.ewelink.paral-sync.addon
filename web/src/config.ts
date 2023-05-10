import EEnv from '../src/ts/enum/EEnv';

const isTestEnv = () => import.meta.env.DEV;
/** 环境 */
const env = isTestEnv() ? EEnv.TEST : EEnv.PROD;

/** 调试用ip */
const smartHomeIp = isTestEnv() ? 'localhost' : 'localhost';
/** 版本(从.env文件获取) */
const version = import.meta.env.VITE_VERSION;

/** 请求 baseURL */
const apiUrl = `http://${smartHomeIp}:8321/api/v1`;

// 请求用ak/sk
const TEST_APPID = '';
const TEST_SECRET = '';
const PROD_APPID = '';
const PROD_SECRET = '';
const appId = isTestEnv() ? TEST_APPID : PROD_APPID;
const appSecret = isTestEnv() ? TEST_SECRET : PROD_SECRET;

console.log(`当前版本为 ${version}`);

export { apiUrl, appSecret, appId, env };
