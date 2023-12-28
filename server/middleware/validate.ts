import _ from 'lodash';
import { NextFunction, Request, Response } from 'express';
import { getErrorMsg } from '../utils/validate';

/**
 * @description 参数错误校验 Parameter error checking
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {*} 
 */
async function validate(req: Request, res: Response, next: NextFunction) {
    const error = getErrorMsg(req);
    if (error) return res.status(400).json(error);
    next();
}

export default validate;
