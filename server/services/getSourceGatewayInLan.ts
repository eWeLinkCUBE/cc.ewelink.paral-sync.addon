import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import gatewayMapUtil from '../utils/gatewayMapUtil';
import nsPanelProApi from '../api/nsPanelPro';

interface IGateway {
    /** ip地址 */
    ip: string;
    /** mac地址 */
    mac: string;
    /** 名称 */
    name: string;
    /** 域名 */
    domian: string;
    /** 开始获取token的时间戳，若无获取则为空 */
    ts: string;
    /** 是否获取到凭证 */
    gotToken: boolean;
}
[];

interface IApiGatewayInfo {
    ip: string;
    mac: string;
    /** 网关服务域名。 */
    domain: string;
}

/** 获取局域网内的iHost及NsPanelPro设备(1300) */
export default async function getSourceGatewayInLan(req: Request, res: Response) {
    try {
        const gatewayInfoList = gatewayMapUtil.getMDnsGatewayList();

        if (gatewayInfoList.length === 0) {
            return res.json(toResponse(0, 'success', []));
        }

        logger.info('getSourceGatewayInLan api response--------------------', gatewayInfoList);

        const requestList = gatewayInfoList.map((item) => {
            return nsPanelProApi.getGatewayInfo(item.ip);
        });

        const promiseResList = await Promise.all(requestList);
        logger.info('promiseResList---------------------------------', promiseResList);
        const existGatewayInfoList: IGateway[] = [];
        promiseResList.forEach((gatewayRes) => {
            if (!gatewayRes) {
                return;
            }

            if (gatewayRes.error === 0 && gatewayRes.data) {
                const apiGatewayInfo = gatewayRes.data;

                const mDnsGatewayInfo = gatewayInfoList.find((gItem) => gItem.ip === apiGatewayInfo.ip);
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
                    domian: apiGatewayInfo.domain,
                    /** 开始获取token的时间戳，若无获取则为空 */
                    ts: '',
                    /** 是否获取到凭证 */
                    gotToken: false,
                };
                mDnsGatewayInfo && existGatewayInfoList.push(obj);
            }
        });

        return res.json(toResponse(0, 'success', existGatewayInfoList));
    } catch (error: any) {
        logger.error(`getSourceGatewayInLan error----------------: ${error.message}`);
        res.json(toResponse(500));
    }
}
