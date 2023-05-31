// 临时缓存数据
import _ from 'lodash';
import { GatewayDeviceItem } from '../ts/interface/CubeApi';

/** 同步来源网关的设备数据组 */
export const srcGatewayDeviceGroup: { srcGatewayMac: string; deviceList: GatewayDeviceItem[] }[] = [];

/**
 * 更新同步来源网关的设备数据组
 *
 * @param srcGatewayMac 同步来源网关 MAC 地址
 * @param deviceList 同步来源网关的设备数据
 */
export function updateSrcGatewayDeviceGroup(srcGatewayMac: string, deviceList: GatewayDeviceItem[]) {
    const groupItem = _.find(srcGatewayDeviceGroup, { srcGatewayMac });
    if (groupItem) {
        groupItem.deviceList = deviceList;
    } else {
        srcGatewayDeviceGroup.push({
            srcGatewayMac,
            deviceList
        });
    }
}
