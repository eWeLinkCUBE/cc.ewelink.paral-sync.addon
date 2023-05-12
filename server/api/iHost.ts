import EMethod from '../ts/enum/EMethod';
import { request, requestNoError } from '../utils/requestIHost';
import IGatewayInfo from '../ts/interface/IGatewayInfo';
export const getPermissionApi = (params: { app_name: string }) => {
    return request<{ token: string }>('/bridge/access_token', EMethod.GET, params);
};

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
