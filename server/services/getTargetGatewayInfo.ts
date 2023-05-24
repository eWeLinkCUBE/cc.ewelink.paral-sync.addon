import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import os from 'os';
import EErrorCode from '../ts/enum/EErrorCode';
import _ from 'lodash';
import getGatewayInfo from './public/getGatewayInfo';
import EGatewayType from '../ts/enum/EGatewayType';

/** 获取本机网关信息(1000) */
export default async function getTargetGatewayInfo(req: Request, res: Response) {
    try {
        //1、获取本机网关ip信息
        // const ipAddressInfo = getIPAdressInfo();
        // logger.info('ipAddressInfo-------------------', ipAddressInfo);
        // if (!ipAddressInfo) {
        //     return res.json(toResponse(EErrorCode.ADDON_NO_IN_IHOST, 'addon not in iHost'));
        // }
        //2、接口获取网关信息
        const gatewayInfo = await getGatewayInfo('iHost', EGatewayType.IHOST);

        if (typeof gatewayInfo === 'number') {
            return res.json(toResponse(gatewayInfo));
        }

        logger.info('getTargetGatewayInfo api response--------------------', gatewayInfo);

        return res.json(toResponse(0, 'success', gatewayInfo));
    } catch (error: any) {
        logger.error(`getTargetGatewayInfo code error----------------: ${error.message}`);
        res.json(toResponse(500));
    }
}

//获取本机ip地址
function getIPAdressInfo() {
    const interfaces = os.networkInterfaces();
    // logger.info('interfaces===', JSON.stringify(interfaces));
    for (const devName in interfaces) {
        const iface = interfaces[devName];
        if (!iface) return null;
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            // logger.info(`isInnerIPFn => ${alias.address}` + isInnerIPFn(alias.address));
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal && isInnerIPFn(alias.address)) {
                return alias as {
                    /** 分配的 IPv4 或 IPv6 地址  */
                    address: string;
                    /** IPv4 或 IPv6 网络掩码 */
                    netmask: string;
                    /** IPv4 或 IPv6 */
                    family: string;
                    /** 网络接口的 MAC 地址 */
                    mac: string;
                    /** 如果网络接口是不能远程访问的环回或类似接口，则为 true；否则为 false */
                    internal: boolean;
                    /** 使用 CIDR 表示法的路由前缀分配的 IPv4 或 IPv6 地址。 如果 netmask 无效，则此属性设置为 null。 */
                    cidr: string;
                };
            }
        }
    }
    return null;
}

/*判断是否是内网IP*/
function isInnerIPFn(ip: string) {
    const ipNum = getIpNum(ip);
    let isInnerIp = false; //默认给定IP不是内网IP
    /**
     * 私有IP：A类  10.0.0.0    -10.255.255.255
     *       B类  172.16.0.0  -172.31.255.255
     *       C类  192.168.0.0 -192.168.255.255
     *       D类   127.0.0.0   -127.255.255.255(环回地址)
     **/
    const aBegin = getIpNum('10.0.0.0');
    const aEnd = getIpNum('10.255.255.255');
    const bBegin = getIpNum('172.16.0.0');
    const bEnd = getIpNum('172.31.255.255');
    const cBegin = getIpNum('192.168.0.0');
    const cEnd = getIpNum('192.168.255.255');
    const dBegin = getIpNum('127.0.0.0');
    const dEnd = getIpNum('127.255.255.255');
    isInnerIp = isInner(ipNum, aBegin, aEnd) || isInner(ipNum, bBegin, bEnd) || isInner(ipNum, cBegin, cEnd) || isInner(ipNum, dBegin, dEnd);
    return isInnerIp;
}

function getIpNum(ip: string) {
    /*获取IP数*/
    const curIp = ip.split('.');
    const a = parseInt(curIp[0]);
    const b = parseInt(curIp[1]);
    const c = parseInt(curIp[2]);
    const d = parseInt(curIp[3]);
    const ipNum = a * 256 * 256 * 256 + b * 256 * 256 + c * 256 + d;
    return ipNum;
}

function isInner(userIp: number, begin: number, end: number) {
    return userIp >= begin && userIp <= end;
}
