import cryptoJS from 'crypto-js';
import _ from 'lodash';
import { NextFunction, Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import config from '../config';

function getSign(params: any, appSecret: string) {
    let sign = '';
    try {
        Object.keys(params)
            .sort()
            .forEach((key) => {
                const value = _.get(params, key);
                sign += `${key}${typeof value === 'object' ? JSON.stringify(value) : value}`;
            });
        sign = cryptoJS
            .MD5(`${appSecret}${encodeURIComponent(sign)}${appSecret}`)
            .toString()
            .toUpperCase();
    } catch (err) {
        logger.error('got error here', err);
    }

    return sign;
}

/**
 *
 * 鉴权
 * @date 17/11/2022
 * @export
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {*}
 */
export default async function oauth(req: Request, res: Response, next: NextFunction) {
    if (req.url.indexOf('sse') > -1 && req.method === 'GET') {
        return next();
    }
    const { headers, method, query, body } = req;
    const headerSign = headers['sign'] as string;
    const params = method === 'GET' ? query : body;
    const { appid } = params;
    const { appId, appSecret } = config.auth;

    //开放给后端控制设备的接口，不用鉴权
    const { directive = null } = body;
    if (directive) {
        return next();
    }

    // 检验sign是否存在
    if (!headerSign) {
        logger.error('oauth error: sign in headers is required');
        return res.json(toResponse(401, 'sign in headers is required'));
    }

    // 校验sign的格式
    const [signTitle, sign] = headerSign.split(' ');

    if (signTitle !== 'Sign' || !sign) {
        logger.error('oauth error: sign in headers is not in right format');
        return res.json(toResponse(401, "sign in headers must begin with 'Sign'"));
    }

    // 计算并比较sign
    const curSign = getSign(params, appSecret);
    if (curSign !== sign) {
        logger.error('oauth error: sign in headers is invalid!');
        return res.json(toResponse(401, 'sign in headers is invalid'));
    }

    // 检测appid
    if (!appid) {
        logger.error('oauth error: appid is missing');
        return res.json(toResponse(401, 'sign in headers is invalid'));
    }

    // 比较appid
    if (appid !== appId) {
        logger.error('oauth error: appid is invalid');
        return res.json(toResponse(401, 'appid is invalid'));
    }

    return next();
}
