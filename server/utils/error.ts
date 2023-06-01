import _ from 'lodash';
import logger from '../log';

const ERROR_LIST = [
    {
        errCode: 0,
        errMsg: 'Success'
    },
    {
        errCode: 500,
        errMsg: 'Internel Error'    // 服务端内部错误
    },
    {
        errCode: 501,
        errMsg: 'No such gateway'   // 无相应的网关信息 DEP
    },
    {
        errCode: 502,
        errMsg: 'Gateway IP invalid'    // 请求网关的 IP 无效 DEP
    },
    {
        errCode: 503,
        errMsg: 'Gateway token invalid'    // 请求网关的凭证无效 DEP
    },
    {
        errCode: 504,
        errMsg: 'DB lock busy'    // 数据库锁繁忙 DEP
    },
    {
        errCode: 600,
        errMsg: 'eWeLink Cube API - getDeviceList error: token invalid'    // eWeLink Cube API 获取设备列表凭证无效
    },
    {
        errCode: 601,
        errMsg: 'eWeLink Cube API - getDeviceList error: timeout'    // eWeLink Cube API 获取设备列表请求超时
    },
    {
        errCode: 602,
        errMsg: 'eWeLink Cube API - syncDevice error: token invalid'    // eWeLink Cube API 添加第三方设备凭证无效
    },
    {
        errCode: 603,
        errMsg: 'eWeLink Cube API - syncDevice error: timeout'    // eWeLink Cube API 添加第三方设备请求超时
    },
    {
        errCode: 604,
        errMsg: 'eWeLink Cube API - syncDevice error: params invalid'    // eWeLink Cube API 添加第三方设备参数错误
    },
    {
        errCode: 605,
        errMsg: 'eWeLink Cube API - getGatewayToken error: token invalid'    // eWeLink Cube API 获取网关凭证无效
    },
    {
        errCode: 606,
        errMsg: 'eWeLink Cube API - deleteDevice error: token invalid'    // eWeLink Cube API 删除设备凭证无效
    },
    {
        errCode: 607,
        errMsg: 'eWeLink Cube API - deleteDevice error: timeout'    // eWeLink Cube API 删除设备请求超时
    },
    {
        errCode: 608,
        errMsg: 'eWeLink Cube API - deleteDevice error: device not found'    // eWeLink Cube API 删除设备不存在
    },
    {
        errCode: 701,
        errMsg: 'No dest gateway info'    // 无同步目标网关的信息
    },
    {
        errCode: 702,
        errMsg: 'Dest gateway IP invalid'    // 同步目标网关的 IP 不可用
    },
    {
        errCode: 703,
        errMsg: 'Dest gateway token invalid'    // 同步目标网关的凭证不可用
    },
    {
        errCode: 1101,
        errMsg: 'IP can not connect',   // IP 地址无法连接
    },
    {
        errCode: 1400,
        errMsg: 'NSPro gateway need login'    // NSPro 网关需要登录
    },
    {
        errCode: 1500,
        errMsg: 'No src gateway info'    // 无同步来源网关的信息
    },
    {
        errCode: 1501,
        errMsg: 'Src gateway IP invalid'    // 同步来源网关的 IP 不可用
    },
    {
        errCode: 1502,
        errMsg: 'Src gateway token invalid'    // 同步来源网关的凭证不可用
    },
    {
        errCode: 1503,
        errMsg: 'Sync device not in src gateway'    // 同步设备不在同步来源网关中
    },
    {
        errCode: 1800,
        errMsg: 'Unsync device not found'    // 取消同步的设备不存在
    },
    {
        errCode: 2000,
        errMsg: 'Delete gateway not found'    // 删除的网关不存在
    },
];

export function toResponse(error: number, msg?: string, data?: any) {
    const found = _.find(ERROR_LIST, { errCode: error });
    let result = null;
    if (found) {
        result = {
            error: found.errCode,
            msg: msg || found.errMsg,
            data
        };
    } else {
        result = {
            error: 500,
            msg: msg || 'Internal Error',
            data
        };
    }
    logger.info(`(toResponse) result: ${JSON.stringify(result)}`);
    return result;
}
