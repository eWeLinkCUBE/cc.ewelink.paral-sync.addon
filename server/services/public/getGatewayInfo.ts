import _ from 'lodash';
import logger from '../../log';
import EErrorCode from '../../ts/enum/EErrorCode';
import EGatewayType from '../../ts/enum/EGatewayType';
import db from '../../utils/db';
import CubeApi from '../../lib/cube-api';
import { IGatewayInfoItem } from '../../utils/db';

/** 接口获取网关信息并存储到数据库中 */
export default async (ipAddress: string, type: EGatewayType) => {
    try {
        let ip = ipAddress;
        if (type === EGatewayType.NS_PANEL_PRO) {
            ip = ipAddress + ':8081';
        }

        const ApiClient = CubeApi.ihostApi;
        const gatewayClient = new ApiClient({ ip });

        const gatewayRes = await gatewayClient.getBridgeInfo();

        logger.info('gatewayRes----------------', gatewayRes);

        if (gatewayRes.error !== 0 || !gatewayRes.data) {
            return EErrorCode.IP_CAN_NOT_CONNECT;
        }

        const { mac, domain } = gatewayRes.data;

        const defaultGatewayInfo = {
            /** mac地址 */
            mac,
            /** ip地址 */
            ip,
            /** 名称 */
            name: type,
            /** 域名 */
            domain,
            /** 凭证 */
            token: '',
            /** 获取凭证时间起点 */
            ts: '',
            /** ip是否有效 */
            ipValid: true,
            /** 凭证是否有效 */
            tokenValid: false,
        };

        if (type === EGatewayType.IHOST) {
            const destGatewayInfo = await db.getDbValue('destGatewayInfo');
            if (!destGatewayInfo) {
                await db.setDbValue('destGatewayInfo', defaultGatewayInfo);
                return omitToken(defaultGatewayInfo);
            }

            const newDestGatewayInfo = _.merge(destGatewayInfo, { mac, ip, domain, ipValid: true });

            await db.setDbValue('destGatewayInfo', newDestGatewayInfo);
            return omitToken(newDestGatewayInfo);
        }

        if (type === EGatewayType.NS_PANEL_PRO) {
            const srcGatewayInfoList = await db.getDbValue('srcGatewayInfoList');
            if (!srcGatewayInfoList) {
                await db.setDbValue('srcGatewayInfoList', [defaultGatewayInfo]);
                return omitToken(defaultGatewayInfo);
            }

            const srcGatewayInfo = srcGatewayInfoList.find((item) => item.mac === mac);

            if (srcGatewayInfo) {
                _.merge(srcGatewayInfo, { ip, ipValid: true });
                await db.setDbValue('srcGatewayInfoList', srcGatewayInfoList);
                return omitToken(srcGatewayInfo);
            } else {
                srcGatewayInfoList.push(defaultGatewayInfo);
                await db.setDbValue('srcGatewayInfoList', srcGatewayInfoList);
                return omitToken(defaultGatewayInfo);
            }
        }
    } catch (error: any) {
        logger.error('getGatewayInfo error-----------------------------', error);
        return null;
    }
};

//不给前端token
function omitToken(gatewayInfo: IGatewayInfoItem) {
    return _.omit(gatewayInfo, 'token');
}
