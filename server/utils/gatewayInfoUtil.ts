import db from './db';
import IGatewayInfo from '../ts/interface/IGatewayInfo';
import _ from 'lodash';
import logger from '../log';
/** 根据mac地址获取数据库里的网关信息 */
function getGatewayByMac(mac: string) {
    const gatewayInfoObj = db.getDbValue('gatewayInfoObj');
    return _.get(gatewayInfoObj, mac, null);
}

/** 根据mac地址更新网关信息 */
function setGatewayInfoByMac(mac: string, gatewayInfo: IGatewayInfo) {
    const gatewayInfoObj = db.getDbValue('gatewayInfoObj');
    _.set(gatewayInfoObj, [mac], gatewayInfo);
    db.setDbValue('gatewayInfoObj', gatewayInfoObj);
}

/** 获取所有网关信息 */
function getAllGatewayInfoList() {
    const gatewayInfoObj = db.getDbValue('gatewayInfoObj');
    return Object.values(gatewayInfoObj);
}

export default {
    getGatewayByMac,
    setGatewayInfoByMac,
    getAllGatewayInfoList,
};
