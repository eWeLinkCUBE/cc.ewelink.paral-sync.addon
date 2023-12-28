import _ from 'lodash';
import { GatewayDeviceItem } from "../ts/interface/CubeApi";
import ping from 'ping';
import logger from '../log';

/**
 * @description 等待指定时间 ms Wait for specified time ms
 * @param {number} time
 * @returns {*} 
 */
function sleep(time: number) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(1);
        }, time)
    })
}



/**
 * @description 判断该ip是否还存活 Determine whether the IP is still alive
 * @param {string} ip
 * @returns {*}  {Promise<boolean>}
 */
async function isIpAlive(ip: string): Promise<boolean> {
    const res = await ping.promise.probe(ip);
    logger.debug(`ping ${ip} result ${JSON.stringify(res)}`);
    return res.alive;
}

/**
 * @description 获取多通道设备的通道数 Get the number of channels of a multi-channel device
 * @export
 * @param {GatewayDeviceItem} device
 * @returns {*} 
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
    isIpAlive
}
