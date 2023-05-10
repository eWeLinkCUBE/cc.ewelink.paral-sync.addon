import fs from 'fs';
import _ from 'lodash';
import config from '../config';
import { encode, decode } from 'js-base64';
import logger from '../log';

type DbKey = keyof IDbData;

interface IDbData {
    /** iHost的凭证 */
    iHostToken: string;
}

export const dbDataTmp: IDbData = {
    iHostToken: '',
};

/** 获取数据库文件所在路径 */
function getDbPath() {
    return config.nodeApp.dbPath;
}

/** 获取所有数据 */
function getDb() {
    const data = fs.readFileSync(getDbPath(), 'utf-8');
    try {
        return JSON.parse(decode(data)) as IDbData;
    } catch (error) {
        logger.error('get db file---------------', 'error-----', error, 'data--------', data);
        return null as unknown as IDbData;
    }
}

/** 清除所有数据 */
function clearStore() {
    fs.writeFileSync(getDbPath(), encode('{}'), 'utf-8');
}

/** 设置指定的数据库数据 */
function setDbValue(key: 'iHostToken', v: IDbData['iHostToken']): void;

function setDbValue(key: DbKey, v: IDbData[DbKey]) {
    const data = getDb();
    _.set(data, key, v);
    fs.writeFileSync(getDbPath(), encode(JSON.stringify(data)), 'utf-8');
}

/** 获取指定的数据库数据 */
function getDbValue(key: 'iHostToken'): IDbData['iHostToken'];

function getDbValue(key: DbKey) {
    const data = getDb();
    return data[key];
}

export default {
    getDb,
    clearStore,
    setDbValue,
    getDbValue,
};
