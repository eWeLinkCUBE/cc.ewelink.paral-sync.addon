import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import gatewayMapUtil from '../utils/gatewayMapUtil';
import nsPanelProApi from '../api/nsPanelPro';
import gatewayInfoUtil from '../utils/gatewayInfoUtil';
import IGatewayInfo from '../ts/interface/IGatewayInfo';

/** 获取局域网内的iHost及NsPanelPro设备(1300) */
export default async function getSourceGatewayInLan(req: Request, res: Response) {
    try {
        const mDnsGatewayInfoList = gatewayMapUtil.getMDnsGatewayList();

        if (mDnsGatewayInfoList.length === 0) {
            return res.json(toResponse(0, 'success', []));
        }

        logger.info('getSourceGatewayInLan api response--------------------', mDnsGatewayInfoList);

        const requestList = mDnsGatewayInfoList.map((item) => {
            return nsPanelProApi.getGatewayInfo(item.ip);
        });

        const promiseResList = await Promise.all(requestList);
        logger.info('promiseResList---------------------------------', promiseResList);
        const existGatewayInfoList: IGatewayInfo[] = [];
        promiseResList.forEach((gatewayRes) => {
            if (!gatewayRes) {
                return;
            }

            if (gatewayRes.error === 0 && gatewayRes.data) {
                const apiGatewayInfo = gatewayRes.data;

                const mDnsGatewayInfo = mDnsGatewayInfoList.find((gItem) => gItem.ip === apiGatewayInfo.ip);
                if (!mDnsGatewayInfo) {
                    return;
                }

                const obj = {
                    /** ip地址 */
                    ip: apiGatewayInfo.ip,
                    /** mac地址 */
                    mac: apiGatewayInfo.mac,
                    /** 名称 */
                    name: mDnsGatewayInfo.name,
                    /** 域名 */
                    domain: apiGatewayInfo.domain,
                    /** 开始获取token的时间戳，若无获取则为空 */
                    ts: '',
                    /** 是否获取到凭证 */
                    gotToken: false,
                };

                gatewayInfoUtil.setGatewayInfoByMac(apiGatewayInfo.mac, obj);

                mDnsGatewayInfo && existGatewayInfoList.push(obj);
            }
        });

        logger.info('Gateway--------------------------------------------------------', gatewayInfoUtil.getAllGatewayInfoList());

        return res.json(toResponse(0, 'success', existGatewayInfoList));
    } catch (error: any) {
        logger.error(`getSourceGatewayInLan error----------------: ${error.message}`);
        res.json(toResponse(500));
    }
}
