import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';
import config from '../config';
import logger from '../log';
import KeyV from 'keyv';
import { KeyvFile } from 'keyv-file';
import encryption from './encryption';
import { ServerSentEvent } from '../ts/class/srcSse';

let store: KeyV | null = null;

/** 是否上锁 */
let lock = false;
/** 当前锁的 ID */
let lockId: string | null = null;

/**
 * 程序等待 ms 的时间
 *
 * @param ms 等待的时长
 */
export function wait(ms: number) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, ms);
    });
}

/**
 * 加锁参数
 *
 * @param retryCount 重试次数
 */
export interface AcquireLockParams {
    retryCount: number;
}

/**
 * 加锁，加锁成功返回当前锁的 ID，否则返回 null
 *
 * @param params 加锁参数
 */
export async function acquireLock(params: AcquireLockParams) {
    const retryCount = params.retryCount || 20;
    let step = 100;

    logger.info(`(acquireLock) retryCount: ${retryCount}`);

    for (let i = 0; i < retryCount; i++) {
        if (lock) {
            logger.info(`(acquireLock) i: ${i}, step: ${step}`);
            // 当前锁被占用
            await wait(step);
            if (step < 10000) {
                step *= 2;
            }
        } else {
            // 锁未被占用
            const curLockId = uuidv4();
            lock = true;
            lockId = curLockId;
            logger.info(`(acquireLock) i: ${i}, lockId: ${curLockId}`);
            return lockId;
        }
    }

    return null;
}

/**
 * 解锁参数
 *
 * @param lockId 当前锁的 ID
 * @param retryCount 重试次数
 */
export interface ReleaseLockParams {
    lockId: string;
    retryCount: number;
}

/**
 * 解锁，解锁成功返回 true，否则返回 false
 *
 * @param params 解锁参数
 */
export async function releaseLock(params: ReleaseLockParams) {
    const curLockId = params.lockId;
    const retryCount = params.retryCount || 20;
    let step = 100;

    logger.info(`(releaseLock) curLockId: ${curLockId}`);
    logger.info(`(releaseLock) retryCount: ${retryCount}`);

    if (!curLockId) {
        return false;
    }

    for (let i = 0; i < retryCount; i++) {
        if (lock && lockId === curLockId) {
            logger.info(`(releaseLock) unlock i: ${i}`);
            // 尝试解锁成功
            lock = false;
            lockId = null;
            return true;
        } else {
            logger.info(`(releaseLock) i: ${i}, step: ${step}`);
            // 尝试解锁失败
            await wait(step);
            if (step < 10000) {
                step *= 2;
            }
        }
    }

    return false;
}

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
                try {
                    const decryptStr = encryption.decryptAES(val, config.auth.appSecret);
                    return JSON.parse(decryptStr);
                } catch (err) {
                    logger.info('[decode info error]', err);
                    return null;
                }
            },
            // decode: JSON.parse
        }),
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
    /** 网关设备id */
    deviceId?: string;
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
    /** 设备是否被支持 */
    isSupported: boolean;
}

interface IDbData {
    /** 是否自动 */
    autoSync: boolean;
    /** 目标网关的信息 */
    destGatewayInfo: null | IGatewayInfoItem;
    /** 来源网关的信息列表 */
    srcGatewayInfoList: IGatewayInfoItem[];
}

export const dbDataTmp: IDbData = {
    autoSync: true,
    destGatewayInfo: null,
    srcGatewayInfoList: [],
};

/** 获取所有数据 */
async function getDb() {
    if (!store) return;
    try {
        const res = {};
        for (const key of Object.keys(dbDataTmp)) {
            const curVal = await store.get(key);
            _.assign(res, {
                [key]: curVal,
            });
        }
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
async function setDbValue(key: 'autoSync', v: IDbData['autoSync']): Promise<void>;
async function setDbValue(key: 'destGatewayInfo', v: IDbData['destGatewayInfo']): Promise<void>;
async function setDbValue(key: 'srcGatewayInfoList', v: IDbData['srcGatewayInfoList']): Promise<void>;
async function setDbValue(key: DbKey, v: IDbData[DbKey]) {
    if (!store) return;
    await store.set(key, v);
}

/** 获取指定的数据库数据 */
async function getDbValue(key: 'autoSync'): Promise<IDbData['autoSync']>;
async function getDbValue(key: 'destGatewayInfo'): Promise<IDbData['destGatewayInfo']>;
async function getDbValue(key: 'srcGatewayInfoList'): Promise<IDbData['srcGatewayInfoList']>;
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
