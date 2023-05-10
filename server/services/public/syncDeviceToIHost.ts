import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import deviceDataUtil from '../../utils/deviceDataUtil';
import { syncDeviceToIHost } from '../../api/iHost';
import logger from '../../log';
import EUiid from '../../ts/enum/EUiid';

/** 同步eWeLink设备到iHost */
export default async (deviceIdList: string[]) => {
    try {
        let endpoints: any = [];

        for (const item of deviceIdList) {
            const uiid = deviceDataUtil.getUiidByDeviceId(item);
            if (uiid === EUiid.uiid_28) {
                const remoteDeviceList = getAllRemoteDeviceList(item);
                const syncDeviceList = deviceDataUtil.generateSyncIHostDeviceDataList28(item, remoteDeviceList);
                endpoints = [...endpoints, ...syncDeviceList];
                continue;
            }
            const endpointObj = await deviceDataUtil.generateSyncIHostDeviceData(item);
            if (endpointObj) {
                endpoints.push(endpointObj);
            }
        }

        if (endpoints.length === 0) {
            return null;
        }

        const params = {
            event: {
                header: {
                    name: 'DiscoveryRequest',
                    message_id: uuidv4(),
                    version: '1',
                },
                payload: {
                    endpoints,
                },
            },
        };
        logger.info('sync device to iHost params====================================', JSON.stringify(params, null, 4));
        const res = await syncDeviceToIHost(params);

        return res;
    } catch (error: any) {
        logger.error('sync device to iHost code error-----------------------------', deviceIdList, error);
        return null;
    }
};

function getAllRemoteDeviceList(deviceId: string) {
    const uiid = deviceDataUtil.getUiidByDeviceId(deviceId);

    if (uiid === EUiid.uiid_28) {
        const eWeLinkDeviceData = deviceDataUtil.getEWeLinkDeviceDataByDeviceId(deviceId);
        const rfList = _.get(eWeLinkDeviceData, ['itemData', 'params', 'rfList'], []) as { rfChl: number; rfVal: string }[];
        const zyx_info = _.get(eWeLinkDeviceData, ['itemData', 'tags', 'zyx_info'], []) as {
            buttonName: { [rfChl: number]: string }[];
            name: string;
            remote_type: '1' | '2' | '3' | '4' | '5' | '6';
        }[];

        const remoteDeviceList: any = [];
        if (!zyx_info) {
            throw new Error('no zyx_info');
        }

        zyx_info.forEach((item) => {
            if (!item.buttonName) {
                return;
            }

            const buttonInfoList: any = [];

            item.buttonName.forEach((it) => {
                const buttonInfoObj: any = [];
                buttonInfoObj['rfchl'] = Number(Object.keys(it)[0]);
                buttonInfoObj['name'] = Object.values(it)[0];
                const thisItem = rfList.find((rItem) => rItem.rfChl === Number(Object.keys(it)[0]));
                if (thisItem) {
                    buttonInfoObj['rfVal'] = thisItem.rfVal;
                }
                buttonInfoList.push(buttonInfoObj);
            });
            const remoteDeviceObj = {
                name: item.name,
                remote_type: item.remote_type,
                buttonInfoList,
            };
            remoteDeviceList.push(remoteDeviceObj);
        });
        logger.info('fffff--------------------------------------------------------', JSON.stringify(remoteDeviceList));

        return remoteDeviceList;
    }
}
