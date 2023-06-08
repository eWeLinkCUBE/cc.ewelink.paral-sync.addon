import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import DB from '../utils/db';
import CubeApi from '../lib/cube-api';
import { srcTokenAndIPInvalid } from '../utils/dealError';

const SUCCESS_RESULT = {
    event: {
        header: {
            name: 'UpdateDeviceStatesResponse',
            message_id: uuidv4(),
            version: '1'
        },
        payload: {}
    }
};

const FAIL_RESULT = {
    event: {
        header: {
            name: 'ErrorResponse',
            message_id: uuidv4(),
            version: '1'
        },
        payload: {}
    }
};

/** iHost 控制设备回调 */
export default async function openControlDevice(req: Request, res: Response) {
    try {
        /** 控制设备的 ID */
        const deviceId = req.params.deviceId;
        logger.info(`(service.openControlDevice) deviceId: ${deviceId}`);
        logger.info(`(service.openControlDevice) req.body: ${JSON.stringify(req.body)}`);

        const directiveName = _.get(req.body, 'directive.header.name');
        const srcGatewayMac = _.get(req.body, 'directive.endpoint.tags.__nsproAddonData.srcGatewayMac');
        const deviceState = _.get(req.body, 'directive.payload.state');

        if (directiveName !== 'UpdateDeviceStates') {
            logger.info(`(service.openControlDevice) RESPONSE: FAIL_RESULT (directiveName)`);
            return res.json(FAIL_RESULT);
        }

        const srcGatewayInfoList = await DB.getDbValue('srcGatewayInfoList');
        const srcGatewayInfo = _.find(srcGatewayInfoList, { mac: srcGatewayMac });
        logger.debug(`(service.openControlDevice) srcGatewayInfo: ${JSON.stringify(srcGatewayInfo)}`);
        if (!srcGatewayInfo) {
            logger.info(`(service.openControlDevice) RESPONSE: FAIL_RESULT (srcGatewayInfo)`);
            return res.json(FAIL_RESULT);
        }

        if (srcGatewayInfo.ipValid && srcGatewayInfo.tokenValid) {
            const ApiClient = CubeApi.ihostApi;
            const client = new ApiClient({ ip: srcGatewayInfo.ip, at: srcGatewayInfo.token });
            const cubeApiRes = await client.updateDeviceState(deviceId, { state: deviceState });
            logger.debug(`(service.openControlDevice) client.updateDeviceState() cubeApiRes: ${JSON.stringify(cubeApiRes)}`);
            if (cubeApiRes.error === 0) {
                logger.info(`(service.openControlDevice) RESPONSE: SUCCESS_RESULT`);
                return res.json(SUCCESS_RESULT);
            } else if (cubeApiRes.error === 401) {
                await srcTokenAndIPInvalid("token", srcGatewayInfo.mac);
                logger.info(`(service.openControlDevice) RESPONSE: FAIL_RESULT (error: 401)`);
                return res.json(FAIL_RESULT);
            } else if (cubeApiRes.error === 1000) {
                await srcTokenAndIPInvalid("ip", srcGatewayInfo.mac);
                logger.info(`(service.openControlDevice) RESPONSE: FAIL_RESULT (error: 1000)`);
                return res.json(FAIL_RESULT);
            } else {
                logger.info(`(service.openControlDevice) client.updateDeviceState() unknown error :${JSON.stringify(cubeApiRes)}`);
                return res.json(FAIL_RESULT);
            }
        } else {
            logger.info(`(service.openControlDevice) RESPONSE: FAIL_RESULT (srcGatewayInfo IP or token invalid)`);
            return res.json(FAIL_RESULT);
        }
    } catch (error: any) {
        logger.error(`(service.openControlDevice) error: ${error.message}`);
        return res.json(toResponse(500));
    }
}
