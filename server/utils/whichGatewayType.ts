import EGatewayType from '../ts/enum/EGatewayType';

/** 判断网关类型 */
export default function (name: string) {
    if (name.indexOf('ihost') > -1) {
        return EGatewayType.IHOST;
    }
    return EGatewayType.NS_PANEL_PRO;
}
