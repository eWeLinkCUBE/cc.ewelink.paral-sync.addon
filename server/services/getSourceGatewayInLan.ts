import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import mDnsGatewayMapUtil from '../utils/mDnsGatewayMapUtil';
import gatewayInfoUtil from '../utils/gatewayInfoUtil';
import IGatewayInfo from '../ts/interface/IGatewayInfo';
import _ from 'lodash';
import getGatewayInfo from './public/getGatewayInfo';

/** 获取局域网内的iHost及NsPanelPro设备(1300) */
export default async function getSourceGatewayInLan(req: Request, res: Response) {
    try {
        const mDnsGatewayInfoList = mDnsGatewayMapUtil.getMDnsGatewayList();

        if (mDnsGatewayInfoList.length === 0) {
            return res.json(toResponse(0, 'success', []));
        }

        logger.info('getSourceGatewayInLan api response--------------------', mDnsGatewayInfoList);

        const requestList = mDnsGatewayInfoList.map((item) => {
            return getGatewayInfo(item.ip, item.type);
        });

        const promiseResList = await Promise.all(requestList);
        logger.info('promiseResList---------------------------------', promiseResList);
        const existGatewayInfoList: IGatewayInfo[] = [];
        promiseResList.forEach((gatewayInfo) => {
            if (typeof gatewayInfo === 'number') {
                return;
            }
            if (!gatewayInfo) {
                return;
            }

            existGatewayInfoList.push(gatewayInfo);
        });

        logger.info('Gateway--------------------------------------------------------', gatewayInfoUtil.getAllGatewayInfoList());

        return res.json(toResponse(0, 'success', existGatewayInfoList));
    } catch (error: any) {
        logger.error(`getSourceGatewayInLan error----------------: ${error.message}`);
        res.json(toResponse(500));
    }
}
