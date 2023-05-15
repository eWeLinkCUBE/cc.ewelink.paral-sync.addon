import logger from '../log';
import CubeApi from '../lib/cube-api';

export interface GatewayInfo {
    ip: string;
    mac: string;
    domain: string;
};

const ApiClient = CubeApi.ihostApi;

/**
 * 获取指定 Hostname 的网关信息，如果指定网关不存在返回 null
 *
 * @param host 网关的 Hostname，iHost 填写 IP (192.168.10.100)，NSPro 填写 IP 加端口号 (192.168.10.200:8080)
 */
export async function getGatewayInfo(host: string): Promise<GatewayInfo | null> {
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
