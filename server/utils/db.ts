import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';
import config from '../config';
import logger from '../log';
import KeyV from 'keyv';
import { KeyvFile } from 'keyv-file';
import encryption from './encryption';
import { ServerSentEvent } from '../ts/class/srcSse';

let store: KeyV | null = null;

/** 
* 是否上锁
* Is it locked?
*/
let lock = false;
/** 
* 当前锁的 ID
* ID of the current lock
*/
let lockId: string | null = null;

/**
 * @description 程序等待 ms 的时间 The program waits for ms
 * @export
 * @param {number} ms 等待的时长 waiting time
 * @returns {*} 
 */
export function wait(ms: number) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, ms);
    });
}

export interface AcquireLockParams {
    /**
     * 重试次数
     * number of retries
     */
    retryCount: number;
}

/**
 * @description 加锁，加锁成功返回当前锁的 ID，否则返回 null Lock. If the lock is successful, the ID of the current lock will be returned. Otherwise, null will be returned.
 * @export
 * @param {AcquireLockParams} params
 * @returns {*} 
 */
export async function acquireLock(params: AcquireLockParams) {
    const retryCount = params.retryCount || 20;
    let step = 100;

    logger.info(`(acquireLock) retryCount: ${retryCount}`);

    for (let i = 0; i < retryCount; i++) {
        if (lock) {
            logger.info(`(acquireLock) i: ${i}, step: ${step}`);
            // 当前锁被占用 The current lock is occupied
            await wait(step);
            if (step < 10000) {
                step *= 2;
            }
        } else {
            // 锁未被占用 The lock is not occupied
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
 * Unlock parameters
 */
export interface ReleaseLockParams {
    /**
     * 当前锁的 ID ID of the current lock
     * ID of the current lock
     */
    lockId: string;
    /**
     * 重试次数
     * number of retries
     */
    retryCount: number;
}

/**
 * @description 解锁，解锁成功返回 true，否则返回 false Unlock, return true if the unlock is successful, otherwise return false
 * @export
 * @param {ReleaseLockParams} params 解锁参数 Unlock parameters
 * @returns {*} 
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
            // 尝试解锁成功 Attempt to unlock successfully
            lock = false;
            lockId = null;
            return true;
        } else {
            logger.info(`(releaseLock) i: ${i}, step: ${step}`);
            // 尝试解锁失败 Unlock attempt failed
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
 * Gateway Information Project
 */
export interface IGatewayInfoItem {
    /** mac */
    mac: string;
    /** ip */
    ip: string;
    /** 名称 */
    name: string;
    /** 域名 */
    domain: string;
    /** 凭证 */
    token: string;
    /** 
    * 获取凭证时间起点
    * Get the voucher time starting point
    */
    ts: string;
    /** 
    * ip是否有效
    * Is the IP valid
    */
    ipValid: boolean;
    /** 
    * 凭证是否有效
    * Is the voucher valid
    */
    tokenValid: boolean;
    /** 
    * 固件版本
    * Firmware version
    */
    fwVersion: string;
    /** 
    * 网关设备id
    * Gateway device id
    */
    deviceId?: string;
}

/**
 * 网关设备数据
 * Gateway device data
 */
export interface IDeviceItem {
    /** 
    * 设备名称
    * Device name
    */
    name: string;
    /** 
    * 设备id
    * device id
    */
    id: string;
    /** 
    * 设备来源，此处为网关的mac地址
    * Device source, here is the mac address of the gateway
    */
    from: string;
    /** 
    * 设备是否已同步
    * Is the device synced
    */
    isSynced: boolean;
    /** 
    * 设备是否被支持
    * Is the device supported
    */
    isSupported: boolean;
}

interface IDbData {
    /** 
    * 是否开启自动同步
    * Whether to enable automatic synchronization
    */
    autoSync: boolean;
    /** 
    * 目标网关的信息
    * Target gateway information
    */
    destGatewayInfo: null | IGatewayInfoItem;
    /** 
    * 来源网关的信息列表
    * Source gateway information list
    */
    srcGatewayInfoList: IGatewayInfoItem[];
}

export const dbDataTmp: IDbData = {
    autoSync: true,
    destGatewayInfo: null,
    srcGatewayInfoList: [],
};

/** 
* 获取所有数据
* Get all data
*/
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

/** 
* 清除所有数据
* Clear all data
*/
async function clearStore() {
    if (!store) return;
    await store.clear();
}

/** 设置指定的数据库数据 Set specified database data */
async function setDbValue(key: 'autoSync', v: IDbData['autoSync']): Promise<void>;
async function setDbValue(key: 'destGatewayInfo', v: IDbData['destGatewayInfo']): Promise<void>;
async function setDbValue(key: 'srcGatewayInfoList', v: IDbData['srcGatewayInfoList']): Promise<void>;
async function setDbValue(key: DbKey, v: IDbData[DbKey]) {
    if (!store) return;
    await store.set(key, v);
}

/** 获取指定的数据库数据 Get specified database data */
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
