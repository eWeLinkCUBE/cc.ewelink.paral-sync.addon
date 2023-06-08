import _ from 'lodash';
import logger from '../../log';
import EGatewayType from '../../ts/enum/EGatewayType';
import db from '../../utils/db';
import CubeApi from '../../lib/cube-api';
import { IGatewayInfoItem } from '../../utils/db';
import encryption from '../../utils/encryption';
import config from '../../config';

/** 接口获取网关信息并存储到数据库中 */
export default async (ipAddress: string, type: EGatewayType, deviceId = '') => {
    try {
        let ip = ipAddress;
        if (type === EGatewayType.NS_PANEL_PRO) {
            ip = ipAddress + ':8081';
        }

        const ApiClient = CubeApi.ihostApi;
        const gatewayClient = new ApiClient({ ip });

        const gatewayRes = await gatewayClient.getBridgeInfo();

        
        if (gatewayRes.error !== 0 || !gatewayRes.data) {
            logger.info('gatewayRes error----------------', JSON.stringify(gatewayRes));
            return 1101;
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
            /** 网关设备id */
            deviceId,
        };

        if (type === EGatewayType.IHOST) {
            const destGatewayInfo = await db.getDbValue('destGatewayInfo');
            if (!destGatewayInfo) {
                await db.setDbValue('destGatewayInfo', defaultGatewayInfo);
                //返回ip，不返回ihost
                return encryptToken(_.merge(defaultGatewayInfo, { ip: gatewayRes.data.ip }));
            }

            const newDestGatewayInfo = _.merge(destGatewayInfo, { mac, ip, domain, ipValid: true });

            await db.setDbValue('destGatewayInfo', newDestGatewayInfo);
            //返回ip，不返回ihost
            return encryptToken(_.merge(newDestGatewayInfo, { ip: gatewayRes.data.ip }));
        }

        if (type === EGatewayType.NS_PANEL_PRO) {
            const srcGatewayInfoList = await db.getDbValue('srcGatewayInfoList');
            if (!srcGatewayInfoList) {
                await db.setDbValue('srcGatewayInfoList', [defaultGatewayInfo]);
                return encryptToken(defaultGatewayInfo);
            }

            const srcGatewayInfo = srcGatewayInfoList.find((item) => item.mac === mac);
            //存在nsPro网关信息
            if (srcGatewayInfo) {
                _.merge(srcGatewayInfo, { ip, ipValid: true });
                await db.setDbValue('srcGatewayInfoList', srcGatewayInfoList);
                return encryptToken(srcGatewayInfo);
            } else {
                //不存在nsPro网关信息
                srcGatewayInfoList.push(defaultGatewayInfo);
                await db.setDbValue('srcGatewayInfoList', srcGatewayInfoList);
                return encryptToken(defaultGatewayInfo);
            }
        }
    } catch (error: any) {
        logger.error('getGatewayInfo error-----------------------------', error);
        return null;
    }
};

/**
 * @description
 * @param {IGatewayInfoItem} gatewayInfo
 * @returns {*}  {IGatewayInfoItem}
 */
function encryptToken(gatewayInfo: IGatewayInfoItem): IGatewayInfoItem {
    gatewayInfo = _.omit(gatewayInfo, 'deviceId');
    const { token } = gatewayInfo;
    gatewayInfo.token = token ? encryption.encryptAES(config.auth.appSecret, token) : '';
    return gatewayInfo;
}
