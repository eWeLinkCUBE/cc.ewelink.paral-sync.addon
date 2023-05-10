import _ from 'lodash';
import logger from '../../log';

/** 同步eWeLink设备到iHost */
export default async (deviceIdList: string[]) => {
    try {
        return '';
    } catch (error: any) {
        logger.error('sync device to iHost code error-----------------------------', deviceIdList, error);
        return null;
    }
};
