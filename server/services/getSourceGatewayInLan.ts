import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import _ from 'lodash';
import db from '../utils/db';
import mDns from '../utils/initMDns';
import config from '../config';
import encryption from '../utils/encryption';

/** 获取局域网内的iHost及NsPanelPro设备(1300) */
export default async function getSourceGatewayInLan(req: Request, res: Response) {
    try {
        queryMDns();

        const destGatewayInfo = await db.getDbValue('destGatewayInfo');
        if (!destGatewayInfo) {
            return res.json(toResponse(701));
        }

        const srcGatewayInfoList = await db.getDbValue('srcGatewayInfoList');

        const sourceGatewayList = srcGatewayInfoList.map((item) => {
            item.token = item.token ? encryption.encryptAES(config.auth.appSecret, item.token) : '';
            return item;
        });

        return res.json(toResponse(0, 'success', sourceGatewayList));
    } catch (error: any) {
        logger.error(`getSourceGatewayInLan error----------------: ${error.message}`);
        res.json(toResponse(500));
    }
}

/** mDns发起询问 */
function queryMDns() {
    mDns.query({
        questions: [
            {
                name: '_ewelink._tcp.local',
                type: 'PTR',
            },
        ],
    });
}
