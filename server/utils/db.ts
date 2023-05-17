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

/**
 * 网关信息项目
 */
export interface IGatewayInfoItem {
    /** mac地址 */
    mac: string;
    /** ip地址 */
    ip: string;
    /** 名称 */
    name: string;
    /** 域名 */
    domain: string;
    /** 凭证 */
    token: string;
    /** 获取凭证时间起点 */
    ts: string;
    /** ip是否有效 */
    ipValid: boolean;
    /** 凭证是否有效 */
    tokenValid: boolean;
}

/**
 * 网关设备数据
 */
export interface IDeviceItem {
    /** 设备名称 */
    name: string;
    /** 设备id */
    id: string;
    /** 设备来源，此处为网关的mac地址 */
    from: string;
    /** 设备是否已同步 */
    isSynced: boolean;
}

// !!!: 已弃用
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
    /** 网关信息列表 */
    gatewayInfoList: IGatewayInfoItem[];
    /** 网关设备列表 */
    gatewayDeviceList: IDeviceItem[];
    /** 被同步目标网关的 mac 地址 */
    destGatewayMac: string;
}

export const dbDataTmp: IDbData = {
    gatewayInfoObj: {},
    autoSync: false,
    gatewayInfoList: [],
    gatewayDeviceList: [],
    destGatewayMac: ''
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
async function setDbValue(key: 'gatewayInfoList', v: IDbData['gatewayInfoList']): Promise<void>;
async function setDbValue(key: 'gatewayDeviceList', v: IDbData['gatewayDeviceList']): Promise<void>;
async function setDbValue(key: 'destGatewayMac', v: IDbData['destGatewayMac']): Promise<void>;
async function setDbValue(key: DbKey, v: IDbData[DbKey]) {
    if (!store) return;
    await store.set(key, v);
}

/** 获取指定的数据库数据 */
async function getDbValue(key: 'gatewayInfoObj'): Promise<IDbData['gatewayInfoObj']>;
async function getDbValue(key: 'autoSync'): Promise<IDbData['autoSync']>;
async function getDbValue(key: 'gatewayInfoList'): Promise<IDbData['gatewayInfoList']>;
async function getDbValue(key: 'gatewayDeviceList'): Promise<IDbData['gatewayDeviceList']>;
async function getDbValue(key: 'destGatewayMac'): Promise<IDbData['destGatewayMac']>;
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
