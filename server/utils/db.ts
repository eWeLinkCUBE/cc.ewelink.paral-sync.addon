import _ from 'lodash';
import config from '../config';
import logger from '../log';
import KeyV from 'keyv';
import { KeyvFile } from 'keyv-file';
import encryption from './encryption';

let store: KeyV | null = null;

export async function initDb(filename: string, isDbFileExist: boolean) {
    // create store object
    store = new KeyV({
        store: new KeyvFile({
            filename,
            // encode function 
            encode: (val: any) => {
                return encryption.encryptAES(JSON.stringify(val), config.auth.appSecret);
            },
            // encode: JSON.stringify,
            // decode function
            decode: (val: any) => {
                const decryptStr = encryption.decryptAES(val, config.auth.appSecret);
                return JSON.parse(decryptStr);
            }
            // decode: JSON.parse
        })
    });

    // first init should init data
    if (!isDbFileExist) {
        for (const key of Object.keys(dbDataTmp)) {
            await store.set(key, dbDataTmp[key as keyof IDbData]);
        }
    }
}


type DbKey = keyof IDbData;
interface IGatewayInfoObj {
    [mac: string]: {
        /** ip地址 */
        ip: string;
        /** mac地址 */
        mac: string;
        /** 名称 */
        name?: string;
        /** 域名 */
        domain: string;
        /** 开始获取token的时间戳，若无获取则为空 */
        ts?: string;
        /** 是否获取到凭证 */
        gotToken?: boolean;
        /** 网关凭证 */
        token: '';
    };
}

interface IDbData {
    /** iHost的信息 */
    gatewayInfoObj: IGatewayInfoObj;
    /** 是否自动 */
    autoSync: boolean;
    /** sse池 */
    ssePool: Map<string, string>;
}

export const dbDataTmp: IDbData = {
    gatewayInfoObj: {},
    autoSync: false,
    ssePool: new Map()
};

/** 获取所有数据 */
async function getDb() {
    if (!store) return;
    try {
        const res = {};
        for (const key of Object.keys(dbDataTmp)) {
            const curVal = await store.get(key);
            _.assign(res, {
                [key]: curVal
            })
        };
        return res as IDbData;
    } catch (error) {
        logger.error('get db file---------------', 'error-----', error);
        return null as unknown as IDbData;
    }
}

/** 清除所有数据 */
async function clearStore() {
    if (!store) return;
    await store.clear();
}

/** 设置指定的数据库数据 */
async function setDbValue(key: 'gatewayInfoObj', v: IDbData['gatewayInfoObj']): Promise<void>;
async function setDbValue(key: 'autoSync', v: IDbData['autoSync']): Promise<void>;
async function setDbValue(key: DbKey, v: IDbData[DbKey]) {
    if (!store) return;
    await store.set(key, v);
}

/** 获取指定的数据库数据 */
async function getDbValue(key: 'gatewayInfoObj'): Promise<IDbData['gatewayInfoObj']>;
async function getDbValue(key: 'autoSync'): Promise<IDbData['autoSync']>;
async function getDbValue(key: DbKey) {
    if (!store) return null;
    const res = await store.get(key);
    return res;
}

export default {
    getDb,
    clearStore,
    setDbValue,
    getDbValue,
};
