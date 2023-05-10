import express from 'express';
import EApiPath from '../ts/enum/EApiPath';
import { checkSchema } from 'express-validator';
import userSchema from '../schema/user';
import validate from '../middleware/validate';
import login from '../services/login';

const router = express.Router();

// ================================user=========================================
router.get(EApiPath.GET_LOGIN_STATUS, checkSchema({}), getLoginStatus);
router.post(EApiPath.LOGIN_BY_ACCOUNT, checkSchema(userSchema), validate, login);
router.put(EApiPath.LOG_OUT, checkSchema({}), logout);

// ================================device========================================
router.get(EApiPath.SCAN_LAN_DEVICE, checkSchema({}), getLanDeviceList);

export default router;
