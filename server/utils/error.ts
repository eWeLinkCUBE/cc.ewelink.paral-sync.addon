import _ from 'lodash';

export function toResponse(error: number, msg?: string, data?: any) {
    const errorMsg = _.get(ERROR_MAPPING, error);

    const res = {
        error,
        msg: errorMsg || msg || "Internal Error",
    }

    return data ? Object.assign(res, { data }) : res;
}

const ERROR_MAPPING = {
    0: "success",
    500: "Internal Error",
    // 找不到相应 mac 地址的网关信息
    1200: 'No such gateway',
    // 相应网关的 IP 地址无效
    1201: 'Gateway IP address could not be reached',
    // 请求超时
    1202: 'Get token timeout',
    // 网关信息被删除
    1203: 'Gateway has been removed'
}
