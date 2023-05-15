import _ from 'lodash';
import logger from '../../log';
import iHostApi from '../../api/iHost';
import EErrorCode from '../../ts/enum/EErrorCode';
import IGatewayInfo from '../../ts/interface/IGatewayInfo';
import gatewayInfoUtil from '../../utils/gatewayInfoUtil';
import nsPanelPro from '../../api/nsPanelPro';
import EGatewayType from '../../ts/enum/EGatewayType';

/** 接口获取网关信息并存储到数据库中 */
export default async (ipAddress: string, type: EGatewayType) => {
    try {
        if (type === EGatewayType.BOTH) {
            const promiseResList = await Promise.all([iHostApi.getGatewayInfo(ipAddress), nsPanelPro.getGatewayInfo(ipAddress)]);
            logger.info('promiseResList--------------------------------', promiseResList);
            let gatewayResData: any = null;
            for (const res of promiseResList) {
                if (res.error !== 0) {
                    continue;
                }
                gatewayResData = res.data;
            }

            return gatewayResData;
        }

        let request: any = iHostApi.getGatewayInfo;
        if (type === EGatewayType.IHOST) {
            request = iHostApi.getGatewayInfo;
        } else if (type === EGatewayType.NS_PANEL_PRO) {
            request = nsPanelPro.getGatewayInfo;
        }

        const gatewayRes = await request(ipAddress);
        logger.info('gatewayRes----------------', gatewayRes);

        if (gatewayRes.error !== 0 || !gatewayRes.data) {
            return EErrorCode.IP_CAN_NOT_CONNECT;
        }

        const { ip, mac, domain } = gatewayRes.data;

        const gatewayInfo: IGatewayInfo = {
            ip,
            mac,
            domain,
            name: 'iHost',
            ts: '',
            gotToken: false,
        };
        const gatewayInfoDb = gatewayInfoUtil.getGatewayByMac(mac);
        gatewayInfoUtil.setGatewayInfoByMac(mac, gatewayInfo);

        if (gatewayInfoDb) {
            _.merge(gatewayInfo, {
                ts: gatewayInfoDb.ts,
                gotToken: gatewayInfoDb.gotToken,
            });
        }
        return gatewayInfo;
    } catch (error: any) {
        logger.error('getGatewayInfo error-----------------------------', error);
        return null;
    }
};
