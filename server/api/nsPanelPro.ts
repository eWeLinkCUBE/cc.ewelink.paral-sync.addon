import EMethod from '../ts/enum/EMethod';
import { request, requestNoError } from '../utils/requestNsPro';

interface IGatewayInfo {
    ip: string;
    mac: string;
    /** 网关服务域名。 */
    domain: string;
}

/** 获取网关信息
 * ip : xxx.xxx.xxx.xxx
 */
export const getGatewayInfo = (ip?: string) => {
    let requestPath = '';
    if (ip) {
        requestPath = `http://${ip}:8081/open-api/v1/rest`;
    }
    return request<IGatewayInfo>(`${requestPath}/bridge`, EMethod.GET);
};

export default {
    getGatewayInfo,
};
