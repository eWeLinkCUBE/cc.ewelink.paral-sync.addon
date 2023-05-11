import EMethod from '../ts/enum/EMethod';
import { request, requestNoError } from '../utils/requestIHost';
import IHostDevice from '../ts/interface/IHostDevice';
export const getPermissionApi = (params: { app_name: string }) => {
    return request<{ token: string }>('/bridge/access_token', EMethod.GET, params);
};

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
        requestPath = `http://${ip}/open-api/v1/rest`;
    }
    return request<IGatewayInfo>(`${requestPath}/bridge`, EMethod.GET);
};

export default {
    getGatewayInfo,
};
