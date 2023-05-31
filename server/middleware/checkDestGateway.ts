import _ from 'lodash';
import { Request, Response, NextFunction } from 'express';
import DB from '../utils/db';
import { toResponse } from '../utils/error';
import logger from '../log';

/**
 * 检查同步目标网关的中间件
 * 对于某些路由 service 来说，前提条件是保证同步目标网关的有效性
 */
export async function checkDestGateway(req: Request, res: Response, next: NextFunction) {
    const method = req.method;
    const url = req.url;

    // 获取网关凭证接口
    const match1 = (method === 'GET') && (url.includes('/api/v1/token'));
    // 获取所有设备的接口
    const match2 = (method === 'GET') && (url.includes('/api/v1/devices'));
    // 同步一个设备接口
    const match3 = (method === 'POST') && (url.includes('/api/v1/device'));
    // 同步所有设备接口
    const match4 = (method === 'POST') && (url.includes('/api/v1/devices'));
    // 取消同步一个设备接口
    const match5 = (method === 'DELETE') && (url.includes('/api/v1/device'));
    // 删除网关接口
    const match6 = (method === 'DELETE') && (url.includes('/api/v1/gateway'));

    if (match1 || match2 || match3 || match4 || match5 || match6) {
        logger.info(`(middle.checkDestGateway) matched`);

        /** 本地同步目标网关信息 */
        const localDestGatewayInfo = await DB.getDbValue('destGatewayInfo');
        if (!localDestGatewayInfo) {
            logger.info(`(middle.checkDestGateway) response: ERR_NO_DEST_GATEWAY_INFO`);
            return res.json(toResponse(701));
        }
    }

    return next();
}
