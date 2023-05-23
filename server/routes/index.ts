import express from 'express';
import EApiPath from '../ts/enum/EApiPath';
import { checkSchema } from 'express-validator';

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
import sse from '../services/sse';

const router = express.Router();

router.get(EApiPath.GET_TARGET_GATEWAY_INFO, checkSchema({}), getTargetGatewayInfo);
router.get(EApiPath.GET_TARGET_GATEWAY_INFO_BY_IP, checkSchema({}), getTargetGatewayInfoByIp);
router.get(EApiPath.GET_GATEWAY_TOKEN, checkSchema({}), getGatewayToken);
router.get(EApiPath.GET_SOURCE_GATEWAY_IN_LAN, checkSchema({}), getSourceGatewayInLan);

router.get(EApiPath.GET_SOURCE_GATEWAY_SUB_DEVICE, checkSchema({}), getSourceGatewaySubDevices);
router.post(EApiPath.SYNC_ONE_DEVICE, checkSchema({}), syncOneDevice);
router.post(EApiPath.SYNC_ALL_DEVICES, checkSchema({}), syncAllDevices);
router.post(EApiPath.CHANGE_IS_AUTO_SYNC_STATUS, checkSchema({}), changeIsAutoSyncStatus);
router.get(EApiPath.GET_AUTO_SYNC_STATUS, checkSchema({}), getAutoSyncStatus);
router.delete(EApiPath.UNSYNC_ONE_DEVICE, checkSchema({}), unsyncOneDevice);
router.delete(EApiPath.DELETE_GATEWAY, checkSchema({}), deleteGateway);

router.get(EApiPath.SSE, checkSchema({}), sse);

export default router;
