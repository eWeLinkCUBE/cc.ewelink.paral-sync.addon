import _ from 'lodash';
import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import DB from '../utils/db';
import CubeApi from '../lib/cube-api';
import { GatewayDeviceItem } from '../ts/interface/CubeApi';

/**
 * 删除已同步过的设备
 *
 * @param srcGatewayMac 同步来源网关 MAC 地址
 */
async function unsyncDevice(srcGatewayMac: string) {
    try {
        const destGatewayInfo = await DB.getDbValue('destGatewayInfo');
        if (destGatewayInfo?.ipValid && destGatewayInfo.tokenValid) {
            const ApiClient = CubeApi.ihostApi;
            const client = new ApiClient({ ip: destGatewayInfo.ip, at: destGatewayInfo.token });
            let cubeApiRes = await client.getDeviceList();
            if (cubeApiRes.error !== 0) {
                logger.info(`(unsyncDevice) client.getDeviceList() error: ${JSON.stringify(cubeApiRes)}`);
                return;
            }
            const destGatewayDeviceList = cubeApiRes.data.device_list as GatewayDeviceItem[];
            for (const device of destGatewayDeviceList) {
                const mac = _.get(device, 'tags.__nsproAddonData.srcGatewayMac');
                if (mac === srcGatewayMac) {
                    cubeApiRes = await client.deleteDevice(device.serial_number);
                }
            }
        }
    } catch (err: any) {
        logger.error(`(unsyncDevice) error: ${err.message}`);
    }
}

/** 删除指定网关信息（2000） */
export default async function deleteGateway(req: Request, res: Response) {
    try {
        /** 被删除网关的 MAC 地址（该网关一定是同步来源网关） */
        const reqGatewayMac = req.params.mac;
        const srcGatewayList = await DB.getDbValue('srcGatewayInfoList');
        const i = _.findIndex(srcGatewayList, { mac: reqGatewayMac });
        if (i === -1) {
            logger.info(`(service.deleteGateway) RESPONSE: ERR_DELETE_GATEWAY_NOT_FOUND`);
            return res.json(toResponse(2000));
        } else {
            const updatedList = srcGatewayList.splice(i, 1);
            await DB.setDbValue('srcGatewayInfoList', updatedList);
            await unsyncDevice(reqGatewayMac);
            logger.info(`(service.deleteGateway) RESPONSE: ERR_SUCCESS`);
            return res.json(toResponse(0));
        }
    } catch (error: any) {
        logger.error(`(service.deleteGateway) error: ${error.message}`);
        return res.json(toResponse(500));
    }
}
