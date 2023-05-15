import logger from '../log';
import CubeApi from '../lib/cube-api';

export interface GatewayInfo {
    ip: string;
    mac: string;
    domain: string;
};

const ApiClient = CubeApi.ihostApi;

/**
 * 获取指定 Hostname 的网关信息，如果指定网关不存在返回 null，否则返回网关信息
 *
 * @param host 网关的 Hostname，iHost 填写 IP (192.168.10.100)，NSPro 填写 IP 加端口号 (192.168.10.200:8080)
 */
export async function getGatewayInfo(host: string): Promise<GatewayInfo | null> {
    logger.debug(`(api.getGatewayInfo) host: ${host}`);
    const client = new ApiClient({ ip: host });
    const result = await client.getBridgeInfo();
    if (result.error === 0) {
        logger.info(`(api.getGatewayInfo) result.data: ${JSON.stringify(result.data)}`);
        return result.data;
    } else {
        logger.warn(`(api.getGatewayInfo) ${host} could not be reached`);
        return null;
    }
}

/**
 * 获取指定 Hostname 的网关凭证，如果超时返回 null，否则返回网关凭证
 *
 * @param host 网关的 Hostname，iHost 填写 IP (192.168.10.100)，NSPro 填写 IP 加端口号 (192.168.10.200:8080)
 * @param timeout 请求的总超时时长，单位 ms
 * @param interval 请求的间隔时长，单位 ms
 */
export async function getGatewayToken(host: string, timeout?: number, interval?: number): Promise<string | null> {
    logger.debug(`(api.getGatewayToken) host: ${host}, timeout: ${timeout}, interval: ${interval}`);
    const client = new ApiClient({ ip: host });
    const result = await client.getBridgeAT({ timeout, interval }) as any;
    if (result.error === 0) {
        const token = result.data.token;
        logger.info(`(api.getGatewayToken) result.data.token: ${token}`);
        return token;
    } else {
        logger.warn(`(api.getGatewayToken) get ${host} token timeout`);
        return null;
    }
}
