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
export const ERR_NO_DEST_GATEWAY_INFO = 701;
/** 同步目标网关的 IP 不可用 */
export const ERR_DEST_GATEWAY_IP_INVALID = 702;
/** 同步目标网关的凭证不可用 */
export const ERR_DEST_GATEWAY_TOKEN_INVALID = 703;

/** 无同步来源网关的信息 */
export const ERR_NO_SRC_GATEWAY_INFO = 1500;
/** 同步来源网关的 IP 不可用 */
export const ERR_SRC_GATEWAY_IP_INVALID = 1501;
/** 同步来源网关的凭证不可用 */
export const ERR_SRC_GATEWAY_TOKEN_INVALID = 1502;
/** 同步设备不在同步来源网关中 */
export const ERR_SYNC_DEVICE_NOT_IN_SRC_GATEWAY = 1503;

/** eWeLink Cube API 获取设备列表凭证无效 */
export const ERR_CUBEAPI_GET_DEVICE_TOKEN_INVALID = 600;
/** eWeLink Cube API 获取设备列表请求超时 */
export const ERR_CUBEAPI_GET_DEVICE_TIMEOUT = 601;
/** eWeLink Cube API 添加第三方设备凭证无效 */
export const ERR_CUBEAPI_SYNC_DEVICE_TOKEN_INVALID = 602;
/** eWeLink Cube API 添加第三方设备请求超时 */
export const ERR_CUBEAPI_SYNC_DEVICE_TIMEOUT = 603;
/** eWeLink Cube API 添加第三方设备参数错误 */
export const ERR_CUBEAPI_SYNC_DEVICE_PARAMS_INVALID = 604;
/** eWeLink Cube API 获取网关凭证无效 */
export const ERR_CUBEAPI_GET_GATEWAY_TOKEN_TIMEOUT = 605;
/** eWeLink Cube API 删除设备凭证无效 */
export const ERR_CUBEAPI_DELETE_DEVICE_TOKEN_INVALID = 606;
/** eWeLink Cube API 删除设备请求超时 */
export const ERR_CUBEAPI_DELETE_DEVICE_TIMEOUT = 607;
/** eWeLink Cube API 删除设备不存在 */
export const ERR_CUBEAPI_DELETE_DEVICE_NOT_FOUND = 608;

/** 无相应的网关信息 */
export const ERR_NO_SUCH_GATEWAY = 501;
/** 请求网关的 IP 无效 */
export const ERR_GATEWAY_IP_INVALID = 502;
/** 请求网关的凭证无效 */
export const ERR_GATEWAY_TOKEN_INVALID = 503;
/** 数据库锁繁忙 */
export const ERR_DB_LOCK_BUSY = 504;

/** 取消同步的设备不存在 */
export const ERR_UNSYNC_DEVICE_NOT_FOUND = 1800;

/** 删除的网关不存在 */
export const ERR_DELETE_GATEWAY_NOT_FOUND = 2000;


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
ERROR_MAPPING[ERR_CUBEAPI_DELETE_DEVICE_TOKEN_INVALID] = 'eWeLink Cube API - deleteDevice error: token invalid';
ERROR_MAPPING[ERR_CUBEAPI_DELETE_DEVICE_TIMEOUT] = 'eWeLink Cube API - deleteDevice error: timeout';
ERROR_MAPPING[ERR_CUBEAPI_DELETE_DEVICE_NOT_FOUND] = 'eWeLink Cube API - deleteDevice error: device not found';

ERROR_MAPPING[ERR_NO_SUCH_GATEWAY] = 'No such gateway';
ERROR_MAPPING[ERR_GATEWAY_IP_INVALID] = 'Gateway IP invalid';
ERROR_MAPPING[ERR_GATEWAY_TOKEN_INVALID] = 'Gateway token invalid';
ERROR_MAPPING[ERR_DB_LOCK_BUSY] = 'DB lock busy';

ERROR_MAPPING[ERR_UNSYNC_DEVICE_NOT_FOUND] = 'Unsync device not found';

ERROR_MAPPING[ERR_DELETE_GATEWAY_NOT_FOUND] = 'Delete gateway not found';
