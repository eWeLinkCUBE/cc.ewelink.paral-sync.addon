import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import _ from 'lodash';
import db from '../utils/db';
import mDns from '../utils/initMDns';

/** 获取局域网内的iHost及NsPanelPro设备(1300) */
export default async function getSourceGatewayInLan(req: Request, res: Response) {
    try {
        queryMDns();

        const srcGatewayInfoList = await db.getDbValue('srcGatewayInfoList');

        return res.json(toResponse(0, 'success', srcGatewayInfoList));
    } catch (error: any) {
        logger.error(`getSourceGatewayInLan error----------------: ${error.message}`);
        res.json(toResponse(500));
    }
}

/** mDns发起询问 */
function queryMDns() {
    mDns.query({
        questions: [
            // {
            //     name: 'nspanelpro.local',
            //     type: 'A',
            // },
            // {
            //     name: 'nspanelpro.local',
            //     type: 'PTR',
            // },

            {
                name: '_ewelink._tcp.local',
                type: 'PTR',
            },
        ],
    });
}
