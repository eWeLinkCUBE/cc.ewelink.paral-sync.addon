import express from 'express';
import EApiPath from '../ts/enum/EApiPath';
import { checkSchema } from 'express-validator';
import validate from '../middleware/validate';

import getTargetGatewayInfo from '../services/getTargetGatewayInfo';
import getTargetGatewayInfoByIp from '../services/getTargetGatewayInfoByIp';
import getGatewayToken from '../services/getGatewayToken';
import getSourceGatewayInLan from '../services/getSourceGatewayInLan';
import syncOneDevice from '../services/syncOneDevice';
import syncAllDevices from '../services/syncAllDevices';
import unsyncOneDevice from '../services/unsyncOneDevice';
import getSourceGatewaySubDevices from '../services/getSourceGatewaySubDevices';
import changeIsAutoSyncStatus from '../services/changeIsAutoSyncStatus';
import getAutoSyncStatus from '../services/getAutoSyncStatus';
import deleteGateway from '../services/deleteGateway';

import unsyncOneDeviceSchema from '../schema/unsyncOneDevice';
import getGatewayTokenSchema from '../schema/getGatewayToken';
import syncOneDeviceSchema from '../schema/syncOneDevice';

// 开放接口
import openControlDevice from '../services/openControlDevice';

// SSE 接口
import sse from '../services/sse';

import autoSync from '../schema/autoSync';

const router = express.Router();

router.get(EApiPath.GET_TARGET_GATEWAY_INFO, checkSchema({}), getTargetGatewayInfo);
router.get(EApiPath.GET_TARGET_GATEWAY_INFO_BY_IP, checkSchema({}), getTargetGatewayInfoByIp);
router.get(EApiPath.GET_GATEWAY_TOKEN, checkSchema(getGatewayTokenSchema), validate, getGatewayToken);
router.get(EApiPath.GET_SOURCE_GATEWAY_IN_LAN, checkSchema({}), getSourceGatewayInLan);
router.get(EApiPath.GET_SOURCE_GATEWAY_SUB_DEVICE, checkSchema({}), getSourceGatewaySubDevices);
router.post(EApiPath.SYNC_ONE_DEVICE, checkSchema(syncOneDeviceSchema), validate, syncOneDevice);
router.post(EApiPath.SYNC_ALL_DEVICES, checkSchema({}), syncAllDevices);
router.post(EApiPath.CHANGE_IS_AUTO_SYNC_STATUS, checkSchema(autoSync), validate, changeIsAutoSyncStatus);
router.get(EApiPath.GET_AUTO_SYNC_STATUS, checkSchema({}), getAutoSyncStatus);
router.delete(EApiPath.UNSYNC_ONE_DEVICE, checkSchema(unsyncOneDeviceSchema), validate, unsyncOneDevice);
router.delete(EApiPath.DELETE_GATEWAY, checkSchema({}), deleteGateway);

// 开放接口路由
router.post(EApiPath.OPEN_CONTROL_DEVICE, checkSchema({}), openControlDevice);

// SSE 接口路由
router.get(EApiPath.SSE, checkSchema({}), sse);

export default router;
