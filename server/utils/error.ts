import _ from 'lodash';

export function toResponse(error: number, msg?: string, data?: any) {
    const errorMsg = _.get(ERROR_MAPPING, error);

    const res = {
        error,
        msg: msg || errorMsg || "Internal Error",
    }

    return data ? Object.assign(res, { data }) : res;
}

// 错误码
/** 成功 */
export const ERR_SUCCESS = 0;
/** 内部错误 */
export const ERR_INTERNAL_ERROR = 500;

/** 无同步目标网关的信息 */
export const ERR_NO_DEST_GATEWAY_INFO = 701; // m
/** 同步目标网关的 IP 不可用 */
export const ERR_DEST_GATEWAY_IP_INVALID = 702; // 1 2 3
/** 同步目标网关的凭证不可用 */
export const ERR_DEST_GATEWAY_TOKEN_INVALID = 703; // 2 3

/** 无同步来源网关的信息 */
export const ERR_NO_SRC_GATEWAY_INFO = 800; // 3
/** 同步来源网关的 IP 不可用 */
export const ERR_SRC_GATEWAY_IP_INVALID = 801; // 3
/** 同步来源网关的凭证不可用 */
export const ERR_SRC_GATEWAY_TOKEN_INVALID = 802; // 3
/** 同步设备不在同步来源网关中 */
export const ERR_SYNC_DEVICE_NOT_IN_SRC_GATEWAY = 803; // 3

/** eWeLink Cube API 获取设备列表凭证无效 */
export const ERR_CUBEAPI_GET_DEVICE_TOKEN_INVALID = 600; // 2 3
/** eWeLink Cube API 获取设备列表请求超时 */
export const ERR_CUBEAPI_GET_DEVICE_TIMEOUT = 601; // 2 3
/** eWeLink Cube API 添加第三方设备凭证无效 */
export const ERR_CUBEAPI_SYNC_DEVICE_TOKEN_INVALID = 602; // 3
/** eWeLink Cube API 添加第三方设备请求超时 */
export const ERR_CUBEAPI_SYNC_DEVICE_TIMEOUT = 603; // 3
/** eWeLink Cube API 添加第三方设备参数错误 */
export const ERR_CUBEAPI_SYNC_DEVICE_PARAMS_INVALID = 604; // 3
/** eWeLink Cube API 获取网关凭证超时 */
export const ERR_CUBEAPI_GET_GATEWAY_TOKEN_TIMEOUT = 605; // 1

/** 无相应的网关信息 */
export const ERR_NO_SUCH_GATEWAY = 501; // 2 1
/** 请求网关的 IP 无效 */
export const ERR_GATEWAY_IP_INVALID = 502; // 2 1
/** 请求网关的凭证无效 */
export const ERR_GATEWAY_TOKEN_INVALID = 503; // 2


// 错误映射
const ERROR_MAPPING: any = {};
ERROR_MAPPING[ERR_SUCCESS] = 'Success';
ERROR_MAPPING[ERR_INTERNAL_ERROR] = 'Internal Error';

ERROR_MAPPING[ERR_NO_DEST_GATEWAY_INFO] = 'No dest gateway info';
ERROR_MAPPING[ERR_DEST_GATEWAY_IP_INVALID] = 'Dest gateway IP invalid';
ERROR_MAPPING[ERR_DEST_GATEWAY_TOKEN_INVALID] = 'Dest gateway token invalid';

ERROR_MAPPING[ERR_NO_SRC_GATEWAY_INFO] = 'No src gateway info';
ERROR_MAPPING[ERR_SRC_GATEWAY_IP_INVALID] = 'Src gateway IP invalid';
ERROR_MAPPING[ERR_SRC_GATEWAY_TOKEN_INVALID] = 'Src gateway token invalid';
ERROR_MAPPING[ERR_SYNC_DEVICE_NOT_IN_SRC_GATEWAY] = 'Sync device not in src gateway';

ERROR_MAPPING[ERR_CUBEAPI_GET_DEVICE_TOKEN_INVALID] = 'eWeLink Cube API - getDeviceList error: token invalid';
ERROR_MAPPING[ERR_CUBEAPI_GET_DEVICE_TIMEOUT] = 'eWeLink Cube API - getDeviceList error: timeout';
ERROR_MAPPING[ERR_CUBEAPI_GET_DEVICE_TOKEN_INVALID] = 'eWeLink Cube API - syncDevice error: token invalid';
ERROR_MAPPING[ERR_CUBEAPI_SYNC_DEVICE_TIMEOUT] = 'eWeLink Cube API - syncDevice error: timeout';
ERROR_MAPPING[ERR_CUBEAPI_SYNC_DEVICE_PARAMS_INVALID] = 'eWeLink Cube API - syncDevice error: params invalid';
ERROR_MAPPING[ERR_CUBEAPI_GET_GATEWAY_TOKEN_TIMEOUT] = 'eWeLink Cube API - getGatewayToken error: token invalid';

ERROR_MAPPING[ERR_NO_SUCH_GATEWAY] = 'No such gateway';
ERROR_MAPPING[ERR_GATEWAY_IP_INVALID] = 'Gateway IP invalid';
ERROR_MAPPING[ERR_GATEWAY_TOKEN_INVALID] = 'Gateway token invalid';
