import db from './db';
import IGatewayInfo from '../ts/interface/IGatewayInfo';
import _ from 'lodash';
import logger from '../log';
/** 根据mac地址获取数据库里的网关信息 */
async function getGatewayByMac(mac: string) {
    const gatewayInfoObj = await db.getDbValue('gatewayInfoObj');
    return _.get(gatewayInfoObj, mac, null);
}

/** 根据mac地址更新网关信息 */
async function setGatewayInfoByMac(mac: string, gatewayInfo: IGatewayInfo) {
    const gatewayInfoObj = await db.getDbValue('gatewayInfoObj');
    _.merge(gatewayInfoObj, gatewayInfo);
    _.set(gatewayInfoObj, [mac], gatewayInfoObj);
    await db.setDbValue('gatewayInfoObj', gatewayInfoObj);
}

/** 获取所有网关信息 */
async function getAllGatewayInfoList() {
    const gatewayInfoObj = await db.getDbValue('gatewayInfoObj');
    return Object.values(gatewayInfoObj);
}

export default {
    getGatewayByMac,
    setGatewayInfoByMac,
    getAllGatewayInfoList,
};
