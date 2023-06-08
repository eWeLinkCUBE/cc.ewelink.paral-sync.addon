import _ from 'lodash';
import { Request, Response } from 'express';
import logger from '../log';
import DB from '../utils/db';
import CubeApi from '../lib/cube-api';
import { toResponse } from '../utils/error';
import { GatewayDeviceItem } from '../ts/interface/CubeApi';
import { getDestGatewayDeviceGroup } from '../utils/tmp';
import sseUtils from '../utils/sseUtils';
import SSE from '../ts/class/sse';

/**
 * 从同步目标网关中返回符合条件的设备数据，如果没找到则返回 null
 *
 * @param deviceId 同步设备的 ID
 * @param srcGatewayMac 同步来源网关 MAC 地址
 * @param destGatewayDeviceList 同步目标网关的设备列表
 */
function findDeviceInDestGateway(deviceId: string, srcGatewayMac: string, destGatewayDeviceList: GatewayDeviceItem[]) {
    for (const device of destGatewayDeviceList) {
        const id = _.get(device, 'tags.__nsproAddonData.deviceId');
        const mac = _.get(device, 'tags.__nsproAddonData.srcGatewayMac');
        if (id === deviceId && mac === srcGatewayMac) {
            return device;
        }
    }
    return null;
}

/** 取消同步单个设备（1800） */
export default async function unsyncOneDevice(req: Request, res: Response) {
    try {
        /** 将要被取消同步的设备 ID */
        const willUnsyncDeviceId = req.params.deviceId;
        /** 被取消同步设备的来源网关 */
        const reqSrcGatewayMac = req.body.from;

        logger.info(`(service.unsyncOneDevice) willUnsyncDeviceId: ${willUnsyncDeviceId}`);
        logger.info(`(service.unsyncOneDevice) reqSrcGatewayMac: ${reqSrcGatewayMac}`);

        /** 同步目标网关的信息 */
        const destGatewayInfo = await DB.getDbValue('destGatewayInfo');
        logger.info(`(service.unsyncOneDevice) destGatewayInfo: ${JSON.stringify(destGatewayInfo)}`);
        if (!destGatewayInfo?.ipValid) {
            logger.info(`(service.unsyncOneDevice) RESPONSE: ERR_DEST_GATEWAY_IP_INVALID`);
            return res.json(toResponse(702));
        }
        if (!destGatewayInfo?.tokenValid) {
            logger.info(`(service.unsyncOneDevice) RESPONSE: ERR_DEST_GATEWAY_TOKEN_INVALID`);
            return res.json(toResponse(703));
        }

        const ApiClient = CubeApi.ihostApi;
        const destGatewayClient = new ApiClient({ ip: destGatewayInfo.ip, at: destGatewayInfo.token });
        let destGatewayDeviceList: GatewayDeviceItem[] = [];

        // 拉取同步目标网关的设备列表
        const destRes = await getDestGatewayDeviceGroup(true);
        logger.debug(`(service.unsyncOneDevice) destRes: ${JSON.stringify(destRes)}`);
        if (destRes.error === 0) {
            destGatewayDeviceList = destRes.data.device_list;
        } else {
            return res.json(toResponse(destRes.error));
        }

        const deviceData = findDeviceInDestGateway(willUnsyncDeviceId, reqSrcGatewayMac, destGatewayDeviceList);
        logger.info(`(service.unsyncOneDevice) deviceData: ${JSON.stringify(deviceData)}`);
        if (!deviceData) {
            logger.info(`(service.unsyncOneDevice) RESPONSE: ERR_UNSYNC_DEVICE_NOT_FOUND`);
            return res.json(toResponse(1800));
        }

        // 调用删除设备接口
        const cubeApiRes = await destGatewayClient.deleteDevice(deviceData.serial_number);
        logger.debug(`(service.unsyncOneDevice) destGatewayClient.deleteDevice() cubeApiRes: ${JSON.stringify(cubeApiRes)}`);
        if (cubeApiRes.error === 0) {
            const endpoint = {
                serial_number: deviceData.serial_number,
                third_serial_number: willUnsyncDeviceId
            };
            sseUtils.removeOneDeviceFromDestCache(endpoint);
            logger.info(`(service.unsyncOneDevice) RESPONSE: ERR_SUCCESS`);
            res.json(toResponse(0));
            // 取消同步成功，把结果通过 SSE 告诉前端
            SSE.send({
                name: 'unsync_one_device_result',
                data: {
                    unsyncDeviceId: willUnsyncDeviceId
                }
            });
            return;
        } else if (cubeApiRes.error === 401) {
            logger.info(`(service.unsyncOneDevice) RESPONSE: ERR_CUBEAPI_DELETE_DEVICE_TOKEN_INVALID`);
            return res.json(toResponse(606));
        } else if (cubeApiRes.error === 110000) {
            logger.info(`(service.unsyncOneDevice) RESPONSE: ERR_CUBEAPI_DELETE_DEVICE_NOT_FOUND`);
            return res.json(toResponse(608));
        } else {
            logger.info(`(service.unsyncOneDevice) RESPONSE: ERR_CUBEAPI_DELETE_DEVICE_TIMEOUT`);
            return res.json(toResponse(607));
        }
    } catch (error: any) {
        logger.error(`(service.unsyncOneDevice) error: ${error.message}`);
        return res.json(toResponse(500));
    }
}
