import _ from 'lodash';
import { Request, Response, NextFunction } from 'express';
import DB from '../utils/db';
import { toResponse } from '../utils/error';
import logger from '../log';

/**
 * @description 
 *  检查同步目标网关的中间件, 对于某些路由 service 来说，前提条件是保证同步目标网关的有效性
 *  Check the middleware of the synchronization target gateway. For some routing services, the prerequisite is to ensure the validity of the synchronization target gateway.
 * @export
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {*} 
 */
export async function checkDestGateway(req: Request, res: Response, next: NextFunction) {
    const method = req.method;
    const url = req.url;

    // 获取网关凭证接口 Obtain gateway credential interface
    const match1 = (method === 'GET') && (url.includes('/api/v1/token'));
    // 获取所有设备的接口 获Get all device interfaces
    const match2 = (method === 'GET') && (url.includes('/api/v1/devices'));
    // 同步一个设备接口 Synchronize a device interface
    const match3 = (method === 'POST') && (url.includes('/api/v1/device'));
    // 同步所有设备接口 Synchronize all device interfaces
    const match4 = (method === 'POST') && (url.includes('/api/v1/devices'));
    // 取消同步一个设备接口 Unsynchronize a device interface
    const match5 = (method === 'DELETE') && (url.includes('/api/v1/device'));
    // 删除网关接口 Delete gateway interface
    const match6 = (method === 'DELETE') && (url.includes('/api/v1/gateway'));

    if (match1 || match2 || match3 || match4 || match5 || match6) {
        logger.info(`(middle.checkDestGateway) matched`);

        const localDestGatewayInfo = await DB.getDbValue('destGatewayInfo');
        if (!localDestGatewayInfo) {
            logger.info(`(middle.checkDestGateway) response: ERR_NO_DEST_GATEWAY_INFO`);
            return res.json(toResponse(701));
        }
    }

    return next();
}
