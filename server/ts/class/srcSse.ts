import _ from 'lodash';
import logger from '../../log';
import EventSource from 'eventsource';
import { IAddDevice, IDeviceDeleted, IDeviceInfoUpdate, IDeviceOnOrOffline, IDeviceStateUpdate } from '../interface/ISse';
import sseUtils from '../../utils/sseUtils';
import tools from '../../utils/tools';
import db, { IGatewayInfoItem } from '../../utils/db';
import { srcTokenAndIPInvalid } from '../../utils/dealError';
import { getDestGatewayDeviceGroup, getSrcGatewayDeviceGroup, srcSsePool } from '../../utils/tmp';
import { GatewayDeviceItem } from '../interface/CubeApi';
import CubeApi from '../../lib/cube-api';

export enum ESseStatus {
    /** 连接中 */
    CONNECTING = 'CONNECTING',
    /** 已连接 */
    OPEN = 'OPEN',
    /** 已关闭 */
    CLOSED = 'CLOSED',
    /** 重连中 */
    RECONNECTING = 'RECONNECTING',
}

/**
 * @description 目标网关SSE类
 * @export
 * @class ServerSentEvent
 */
export class ServerSentEvent {
    /** sse连接的id，默认为网关的mac地址 */
    public connectionId: string;
    /** sse连接初始化参数 */
    private initParams: IGatewayInfoItem;
    /** sse连接的状态 */
    public status: ESseStatus;
    /** sse连接实例 */
    private source: EventSource;
    /** sse连接重连次数 */
    private retryCount: number;
    /** sse连接最大重连次数 */
    private maxRetry: number;
    /** sse连接重连间隔，单位为秒 */
    private retryInterval: number;
    /** ping Ip 间隔，单位为秒 */
    private pingInterval: number;
    /** ping定时器id */
    private pingTimer: NodeJS.Timer | null;

    constructor(params: IGatewayInfoItem) {
        this.initParams = params;
        this.source = new EventSource(`http://${this.initParams.ip}/open-api/v1/sse/bridge?access_token=${this.initParams.token}`);
        this.connectionId = this.initParams.mac;
        this.status = ESseStatus.CONNECTING;
        this.retryCount = 0;
        this.retryInterval = 1;
        this.maxRetry = 50;
        this.pingInterval = 60;
        this.pingTimer = null;
        this._initUniversalEvent();
    }

    /**
  * @description 初始化通用事件
  * @memberof ServerSentEvent
  */
    private _initUniversalEvent() {
        return new Promise((resolve) => {
            this.source.onopen = async (event) => {
                logger.info(`src sse init ${this.connectionId} sse success`, event);
                const { ipValid, tokenValid } = this.initParams;
                // token失效和ip失效时要改正
                if (!ipValid || !tokenValid) {
                    logger.info(`src sse init ${this.connectionId} sse ip invalid => ${ipValid} or token invalid ${tokenValid}, correct it now`);
                    this.initParams.ipValid = true;
                    this.initParams.tokenValid = true;
                    await this._updateSseParams();
                }

                this.pingTimer = setInterval(async () => {
                    const isIpAlive = await tools.isIpAlive(this.initParams.ip.split(":")[0]);
                    logger.debug(`begin to ping ${JSON.stringify(this.initParams)} and the result be ${isIpAlive}`);
                    if (!isIpAlive) {
                        this.status = ESseStatus.RECONNECTING;
                        await srcTokenAndIPInvalid('ip', this.initParams.mac);
                        await this._reconnectSse();
                    }
                }, this.pingInterval * 1000);

                await sseUtils.setDeviceOnline(this.initParams);
                this.status = ESseStatus.OPEN;
                this._initGatewayEvent();

                resolve(true);
            };
            this.source.onerror = async (event) => {
                logger.info('src sse init sse error', event);
                // 替换数据
                await this._updateSseParams();
                // 检查ip是否仍为无效，是则将相关设备下线
                if (!this.initParams.ipValid) {
                    logger.info(`src sse init sse error ip still false ${JSON.stringify(this.initParams, null, 2)}`);
                    await srcTokenAndIPInvalid('ip', this.initParams.mac);
                }
                if (this.status !== ESseStatus.RECONNECTING) {
                    this.status = ESseStatus.RECONNECTING;
                    await this._reconnectSse();
                }
                // 开始重连
                resolve(false);
            };
            this.source.onmessage = async (event) => {
                logger.info('src sse onmessage => ', event.data);
                // // 替换数据
                // await this._updateSseParams();
                // // 检查ip是否仍为无效，是则将相关设备下线
                // if (!this.initParams.ipValid) {
                //     logger.info(`src sse init sse error ip still false ${JSON.stringify(this.initParams, null, 2)}`);
                //     await srcTokenAndIPInvalid('ip', this.initParams.mac);
                // }
                // if (this.status !== ESseStatus.RECONNECTING) {
                //     this.status = ESseStatus.RECONNECTING;
                //     await this._reconnectSse();
                // }
                // // 开始重连
                // resolve(false);
            };
        });
    }

    /**
     * @description 初始化监听事件
     * @memberof ServerSentEvent
     */
    private _initGatewayEvent() {
        /** 新增设备 */
        this.source.addEventListener('device#v1#addDevice', (event) => {
            const { payload } = JSON.parse(event.data) as IAddDevice;
            logger.info(`src sse ${this.connectionId} added new device ${event.data}`);
            // 同步设备
            sseUtils.syncOneDevice(payload, this.initParams.mac);
        });

        /** 设备状态更新 */
        this.source.addEventListener('device#v1#updateDeviceState', (event) => {
            const { payload, endpoint } = JSON.parse(event.data) as IDeviceStateUpdate;
            logger.info(`src sse ${this.connectionId} update device state ${event.data}`);
            sseUtils.updateOneDevice({ type: 'state', mac: this.connectionId, payload, endpoint }, this.initParams.mac);
        });

        /** 设备信息更新 */
        this.source.addEventListener('device#v1#updateDeviceInfo', (event) => {
            const { payload, endpoint } = JSON.parse(event.data) as IDeviceInfoUpdate;
            logger.info(`src sse ${this.connectionId} update device info ${event.data}`);
            sseUtils.updateOneDevice({ type: 'info', mac: this.connectionId, payload, endpoint }, this.initParams.mac);
        });

        /** 设备上下线 */
        this.source.addEventListener('device#v1#updateDeviceOnline', (event) => {
            const { payload, endpoint } = JSON.parse(event.data) as IDeviceOnOrOffline;
            logger.info(`src sse ${this.connectionId} update device online ${event.data}`);
            sseUtils.updateOneDevice({ type: 'online', mac: this.connectionId, payload, endpoint }, this.initParams.mac);
        });

        /** 设备被删除 */
        this.source.addEventListener('device#v1#deleteDevice', (event) => {
            logger.info(`src sse ${this.connectionId} delete device ${event.data}`);
            const { endpoint } = JSON.parse(event.data) as IDeviceDeleted;
            // 取消同步设备
            sseUtils.deleteOneDevice(endpoint, this.initParams.mac);
        });
    }

    /**
     * @description 重连sse
     * @memberof ServerSentEvent
     */
    private async _reconnectSse() {
        // 不论成功或失败 每个长连接实例都只会重试50次
        for (; this.retryCount < this.maxRetry;) {
            const retryCount = this.retryCount + 1;
            if (this.status !== ESseStatus.OPEN) {
                // 每次重连之前都关闭连接
                this.source.close();
                // 清除ping的定时器
                if (this.pingTimer) clearInterval(this.pingTimer);
                logger.info(`src sse reconnecting for ${retryCount} 次`);
                logger.info(`src sse reconnect for ${retryCount} times begins in ${Date.now()}`);
                // 尝试重连
                const { ip, token } = this.initParams;
                const url = `http://${ip}/open-api/v1/sse/bridge?access_token=${token}`;
                this.source = new EventSource(url);
                const res = await this._initUniversalEvent();
                if (!res) {
                    logger.info(`src sse reconnect for ${retryCount} time fails in ${Date.now()}`);
                    this.retryCount++;
                    if (retryCount + 1 > this.maxRetry) {
                        logger.info(`reach the max retry count`);
                    } else {
                        logger.info(`wait fo the ${retryCount + 1} times reconnection ${Date.now()}`);
                    }
                    // 最大重试间隔为2小时
                    const actualInterval = this._getRetryInterval(this.retryInterval);
                    await tools.sleep(actualInterval);
                    continue;
                }
            }
            logger.info(`src sse reconnect for ${retryCount} success`);
            // 将重连次数清零
            this.retryCount = 0;
            break;
        }

        if (this.status !== ESseStatus.OPEN) {
            // 重连失败
            // 1.关闭重连 
            // 2.主动关闭sse
            this.status = ESseStatus.CLOSED;
            this.source.close();
        }
    }
    /**
     * @description 生成重试间隔
     * @private
     * @param {number} retryInterval
     * @returns {number} 
     * @memberof ServerSentEvent
     */
    private _getRetryInterval(retryInterval: number): number {
        const TWO_HOURS = 7200000;
        const retryCount = this.retryCount + 1;
        let interval = retryInterval;
        // 默认间隔为2s
        if (retryInterval < 2) {
            interval = 2;
        }
        const userInterval = retryCount * interval * 1000;
        // 最大重试间隔不超过2小时
        return userInterval >= TWO_HOURS ? TWO_HOURS : userInterval;
    }
    /**
     * @description 更新sse连接参数
     * @memberof ServerSentEvent
     */
    private async _updateSseParams() {
        const { mac } = this.initParams;
        const srcGatewayInfoList = await db.getDbValue('srcGatewayInfoList');
        logger.info(`[src sse update sse params] get ${mac} gatewayInfoList ${JSON.stringify(srcGatewayInfoList)}`);
        const curIndex = _.findIndex(srcGatewayInfoList, { mac });
        // logger.info(`[src sse update sse params] update ${mac} for curIndex ${curIndex}`);
        this.initParams = srcGatewayInfoList[curIndex] ? srcGatewayInfoList[curIndex] : this.initParams;
        logger.info(`[src sse update sse params] final update result ${JSON.stringify(this.initParams, null, 2)}`);
    }
}

async function buildServerSendEvent(gateway: IGatewayInfoItem) {
    const stream = new ServerSentEvent(gateway);
    srcSsePool.set(stream.connectionId, stream);
    logger.info(`src sse connections count:${srcSsePool.size}`);
}

export default {
    buildServerSendEvent,
};
