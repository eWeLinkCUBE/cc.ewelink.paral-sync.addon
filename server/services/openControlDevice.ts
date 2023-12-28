import _ from 'lodash';
import { Request, Response } from 'express';
import logger from '../log';
import DB from '../utils/db';
import CubeApi from '../lib/cube-api';
import { srcTokenAndIPInvalid } from '../utils/dealError';
import { getSrcGatewayDeviceGroup } from '../utils/tmp';
import { mergeCapabilities } from '../utils/sseUtils';

const SUPPORT_DIRECTIVE = ['UpdateDeviceStates', 'ConfigureDeviceCapabilities'];

enum FailReason {
    DEVICE_UNREACHABLE = "ENDPOINT_UNREACHABLE",
    DEVICE_LOW_POWER = "ENDPOINT_LOW_POWER",
    INVALID_DIRECTIVE = "INVALID_DIRECTIVE",
    NO_SUCH_DEVICE = "NO_SUCH_ENDPOINT",
    NOT_SUPPORTED_IN_CURRENT_MODE = "NOT_SUPPORTED_IN_CURRENT_MODE",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    REMOTE_KEY_CODE_NOT_LEARNED = "REMOTE_KEY_CODE_NOT_LEARNED",
}

function getSuccessRes(name: 'UpdateDeviceStates' | 'ConfigureDeviceCapabilities') {
    return {
        event: {
            header: {
                name,
                message_id,
                version: '1'
            },
            payload: {}
        }
    }
}

function getFailRes(type: FailReason) {
    return {
        event: {
            header: {
                name: 'ErrorResponse',
                message_id,
                version: '1'
            },
            payload: {
                type
            }
        }
    }
}


let message_id = "";
/** 
* iHost 控制设备回调
* iHost control device callback
*/
export default async function openControlDevice(req: Request, res: Response) {
    try {

        message_id = _.get(req.body, 'directive.header.message_id');
        const deviceId = req.params.deviceId;
        const deviceState = _.get(req.body, 'directive.payload.state');
        const deviceCapabilities = _.get(req.body, 'directive.payload.capabilities');
        const srcGatewayMac = _.get(req.body, 'directive.endpoint.tags.__nsproAddonData.srcGatewayMac');
        const directiveName = _.get(req.body, 'directive.header.name');

        logger.info(`[service.openControlDevice] deviceId: ${deviceId}`);
        logger.info(`[service.openControlDevice] req.body: ${JSON.stringify(req.body)}`);

        if (!SUPPORT_DIRECTIVE.includes(directiveName)) {
            logger.info(`[service.openControlDevice] RESPONSE: FAIL_RESULT (directiveName)`);
            return res.json(getFailRes(FailReason.INVALID_DIRECTIVE));
        }

        const srcGatewayInfoList = await DB.getDbValue('srcGatewayInfoList');
        const srcGatewayInfo = _.find(srcGatewayInfoList, { mac: srcGatewayMac });
        logger.debug(`[service.openControlDevice] srcGatewayInfo: ${JSON.stringify(srcGatewayInfo)}`);
        if (!srcGatewayInfo) {
            logger.info(`[service.openControlDevice] RESPONSE: FAIL_RESULT (srcGatewayInfo)`);
            return res.json(getFailRes(FailReason.INTERNAL_ERROR));
        }

        if (!srcGatewayInfo.ipValid || !srcGatewayInfo.tokenValid) {
            logger.info(`[service.openControlDevice] RESPONSE: FAIL_RESULT (srcGatewayInfo IP or token invalid)`);
            return res.json(getFailRes(FailReason.INTERNAL_ERROR));
        }

        const ApiClient = CubeApi.ihostApi;
        const client = new ApiClient({ ip: srcGatewayInfo.ip, at: srcGatewayInfo.token, debug: true });

        let params;

        if (directiveName === 'UpdateDeviceStates') {
            params = { state: deviceState };
        }

        if (directiveName === 'ConfigureDeviceCapabilities') {
            const srcDeviceGroup = await getSrcGatewayDeviceGroup(srcGatewayMac);
            if (srcDeviceGroup.error !== 0) {
                logger.info(`[dest sse sync new device online] get dest device list fail ${JSON.stringify(srcDeviceGroup)}`);
                return;
            }

            const curDestDevice = _.find(srcDeviceGroup.data.device_list, { serial_number: deviceId });
            if (!curDestDevice) {
                logger.info(`[service.openControlDevice] RESPONSE: FAIL_RESULT (can not find dest device ${deviceId})`);
                return res.json(getFailRes(FailReason.NO_SUCH_DEVICE));
            }

            curDestDevice.capabilities = mergeCapabilities(curDestDevice.capabilities, deviceCapabilities, true);


            params = { capabilities: curDestDevice.capabilities }
        }

        
        const cubeApiRes = await client.updateDeviceState(deviceId, params);
        logger.debug(`[service.openControlDevice] client.updateDeviceState() cubeApiRes: ${JSON.stringify(cubeApiRes)}`);
        
        if (cubeApiRes.error === 0) {
            logger.info(`[service.openControlDevice] RESPONSE: SUCCESS_RESULT`);
            return res.json(getSuccessRes(directiveName));
        } else if (cubeApiRes.error === 401) {
            await srcTokenAndIPInvalid("token", srcGatewayInfo.mac);
            logger.info(`[service.openControlDevice] RESPONSE: FAIL_RESULT (error: 401)`);
            return res.json(getFailRes(FailReason.DEVICE_UNREACHABLE));
        } else if (cubeApiRes.error === 1000) {
            await srcTokenAndIPInvalid("ip", srcGatewayInfo.mac);
            logger.info(`[service.openControlDevice] RESPONSE: FAIL_RESULT (error: 1000)`);
            return res.json(getFailRes(FailReason.DEVICE_UNREACHABLE));
        } else {
            logger.info(`[service.openControlDevice] client.updateDeviceState() unknown error :${JSON.stringify(cubeApiRes)}`);
            return res.json(getFailRes(FailReason.INTERNAL_ERROR));
        }
    } catch (error: any) {
        logger.error(`[service.openControlDevice] error: ${error.message}`);
        return res.json(getFailRes(FailReason.INTERNAL_ERROR));
    }
}