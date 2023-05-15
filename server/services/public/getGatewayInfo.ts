import _ from 'lodash';
import logger from '../../log';
import iHostApi from '../../api/iHost';
import EErrorCode from '../../ts/enum/EErrorCode';
import IGatewayInfo from '../../ts/interface/IGatewayInfo';
import gatewayInfoUtil from '../../utils/gatewayInfoUtil';

/** 接口获取网关信息并存储到数据库中 */
export default async (ipAddress: string) => {
    try {
        //2、接口获取网关信息
        //ipAddressInfo.address
        const iHostRes = await iHostApi.getGatewayInfo(ipAddress);
        logger.info('iHostRes----------------', iHostRes);

        if (iHostRes.error !== 0 || !iHostRes.data) {
            return EErrorCode.IP_CAN_NOT_CONNECT;
        }

        const { ip, mac, domain } = iHostRes.data;

        logger.info('iHostRes----------------------', iHostRes);

        const gatewayInfo: IGatewayInfo = {
            ip,
            mac,
            domain,
            name: 'iHost',
            ts: '',
            gotToken: false,
        };
        const gatewayInfoDb = await gatewayInfoUtil.getGatewayByMac(mac);
        await gatewayInfoUtil.setGatewayInfoByMac(mac, gatewayInfo);

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
