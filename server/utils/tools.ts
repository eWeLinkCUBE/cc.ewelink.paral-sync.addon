import _ from 'lodash';
import { GatewayDeviceItem } from "../ts/interface/CubeApi";

/**
 *
 * 睡眠函数
 * @date 18/05/2023
 * @param {number} time
 */
function sleep(time: number) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(1);
        }, time)
    })
}

/**
 * 获取多通道设备的通道数
 *
 * @param device 设备数据
 */
export function getSwitchChannelNum(device: GatewayDeviceItem) {
    let channelNum = 0;
    const displayCategory = _.get(device, 'display_category');
    const capaList = _.get(device, 'capabilities');
    if (displayCategory === 'switch' || displayCategory === 'plug') {
        let toggleNum = 0;
        let powerCapa = false;
        for (const capa of capaList) {
            if (capa.capability === 'power') {
                powerCapa = true;
            } else if (capa.capability === 'toggle') {
                toggleNum++;
            }
        }

        if (powerCapa) {
            channelNum = toggleNum;
        }
    }
    return channelNum;
}


export default {
    sleep,
}
