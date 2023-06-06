import _ from "lodash";
import logger from "../../log";
import EventSource from "eventsource";
import { IAddDevice, IDeviceDeleted, IDeviceInfoUpdate, IDeviceOnOrOffline, IDeviceStateUpdate } from "../interface/ISse";
import sseUtils from "../../utils/sseUtils";
import tools from "../../utils/tools";
import db, { IGatewayInfoItem } from "../../utils/db";
import { srcTokenAndIPInvalid } from "../../utils/dealError";
import { updateDestSse } from "../../utils/tmp";


export enum ESseStatus {
    /** 连接中 */
    CONNECTING = 'CONNECTING',
    /** 已连接 */
    OPEN = 'OPEN',
    /** 已关闭 */
    CLOSED = 'CLOSED',
    /** 重连中 */
    RECONNECTING = 'RECONNECTING'
}


/**
 * @description 目标网关SSE类
 * @export
 * @class DestServerSentEvent
 */
export class DestServerSentEvent {
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


    constructor(params: IGatewayInfoItem) {
        this.initParams = params;
        this.source = new EventSource(`http://${this.initParams.ip}/open-api/v1/sse/bridge?access_token=${this.initParams.token}`);
        this.connectionId = this.initParams.mac;
        this.status = ESseStatus.CONNECTING;
        this.retryCount = 0;
        this.retryInterval = 1;
        this.maxRetry = 50;
        this._initUniversalEvent();
    }

    /**
     * @description 初始化通用事件
     * @memberof DestServerSentEvent
     */
    private _initUniversalEvent() {
        return new Promise(resolve => {
            this.source.onopen = async (event) => {
                logger.info(`init ${this.connectionId} sse success`, event);
                const { ipValid, tokenValid, mac } = this.initParams;
                // token失效和ip失效时要改正
                if (!ipValid || !tokenValid) {
                    logger.info(`init ${this.connectionId} sse ip invalid => ${ipValid} or token invalid ${tokenValid}, correct it now`);
                    this.initParams.ipValid = true;
                    this.initParams.tokenValid = true;
                    // 替换数据
                    const srcGatewayInfoList = await db.getDbValue('srcGatewayInfoList');
                    const curIndex = _.findIndex(srcGatewayInfoList, { mac });
                    srcGatewayInfoList[curIndex] = this.initParams;
                    await db.setDbValue('srcGatewayInfoList', srcGatewayInfoList);
                }
                this.status = ESseStatus.OPEN;
                this._initGatewayEvent();
                resolve(true);
            }
            this.source.onerror = async (event) => {
                logger.info(`init sse ${this.connectionId} error`, event);
                // 将相关设备下线
                // await srcTokenAndIPInvalid("ip", this.initParams.mac);
                logger.info(`current ${this.connectionId} status ${this.status}`);
                if (this.status !== ESseStatus.RECONNECTING) {
                    this.status = ESseStatus.RECONNECTING;
                    await this._reconnectSse();
                }
                // 开始重连
                resolve(false);
            }
        })
    }

    /**
     * @description 初始化监听事件
     * @memberof DestServerSentEvent
     */
    private _initGatewayEvent() {
        /** 新增设备 */
        this.source.addEventListener('device#v1#addDevice', (event) => {
            const { payload } = JSON.parse(event.data) as IAddDevice;
            logger.info(`dest sse ${this.connectionId} added new device ${event.data}`);
            // 同步设备
            sseUtils.syncOneDeviceToSrcForOnline(payload);
        })

        /** 设备状态更新 */
        this.source.addEventListener('device#v1#updateDeviceState', (event) => {
            const { payload, endpoint } = JSON.parse(event.data) as IDeviceStateUpdate;
            logger.info(`dest sse ${this.connectionId} update device state ${event.data}`);
            // sseUtils.updateOneDevice({ type: 'state', mac: this.connectionId, payload, endpoint }, this.initParams.mac);
        })

        /** 设备信息更新 */
        this.source.addEventListener('device#v1#updateDeviceInfo', (event) => {
            const { payload, endpoint } = JSON.parse(event.data) as IDeviceInfoUpdate;
            logger.info(`dest sse ${this.connectionId} update device info ${event.data}`);
            // sseUtils.updateOneDevice({ type: 'info', mac: this.connectionId, payload, endpoint }, this.initParams.mac);
        })

        /** 设备上下线 */
        this.source.addEventListener('device#v1#updateDeviceOnline', (event) => {
            const { payload, endpoint } = JSON.parse(event.data) as IDeviceOnOrOffline;
            logger.info(`dest sse ${this.connectionId} update device online ${event.data}`);
            // sseUtils.updateOneDevice({ type: 'online', mac: this.connectionId, payload, endpoint }, this.initParams.mac);
        })

        /** 设备被删除 */
        this.source.addEventListener('device#v1#deleteDevice', (event) => {
            logger.info(`dest sse ${this.connectionId} delete device ${event.data}`);
            const { endpoint } = JSON.parse(event.data) as IDeviceDeleted;
            sseUtils.removeOneDeviceFromDestCache(endpoint);
            // 取消同步设备
            // sseUtils.deleteOneDevice(endpoint, this.initParams.mac);
        })
    }
    /**
     * @description 重连sse
     * @memberof DestServerSentEvent
     */
    private async _reconnectSse() {
        // 不论成功或失败 每个长连接实例都只会重试50次
        for (; this.retryCount < this.maxRetry;) {
            const retryCount = this.retryCount + 1;
            logger.info(`sse reconnecting ${this.connectionId} for ${retryCount} status ${this.status}`);
            if (this.status !== ESseStatus.OPEN) {
                // 每次重连之前都关闭连接
                this.source.close();
                logger.info(`sse reconnecting ${this.connectionId} for ${retryCount} times`);
                logger.info(`sse reconnect ${this.connectionId} for ${retryCount} times begins in ${Date.now()}`);
                // 尝试重连
                const { ip, token } = this.initParams;
                const url = `http://${ip}/open-api/v1/sse/bridge?access_token=${token}`;
                logger.info(`sse reconnection ${this.connectionId} url is ${url}`);
                this.source = new EventSource(url);
                const res = await this._initUniversalEvent();
                logger.info(`sse reconnection ${this.connectionId} for ${retryCount} time result =>  ${res}`);
                if (!res) {
                    logger.info(`sse reconnect ${this.connectionId} for ${retryCount} time fails in ${Date.now()}`);
                    this.retryCount++;
                    if (retryCount + 1 > this.maxRetry) {
                        logger.info(`sse reconnection ${this.connectionId} reach the max retry count`);
                    } else {
                        logger.info(`sse reconnection ${this.connectionId} wait fo the ${retryCount + 1} times reconnection ${Date.now()}`);
                    }
                    // 最大重试间隔为2小时
                    const actualInterval = this._getRetryInterval(this.retryInterval);
                    logger.info(`sse reconnection ${this.connectionId} actual interval will be ${actualInterval} ${Date.now()}`);
                    await tools.sleep(actualInterval);
                    continue;
                }
            }
            logger.info(`sse reconnect ${this.connectionId} for ${retryCount} success`);
            // 将重连次数清零
            this.retryCount = 0;
            break;
        }

        if (this.status !== ESseStatus.OPEN) {
            logger.info(`sse final reconnect ${this.connectionId} fail`);
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
     * @memberof DestServerSentEvent
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
     * @param {IGatewayInfoItem} params
     * @memberof DestServerSentEvent
     */
    updateSseParams(params: IGatewayInfoItem) {
        this.initParams = params;
    }
}

async function buildServerSendEvent(gateway: IGatewayInfoItem) {
    const stream = new DestServerSentEvent(gateway);
    updateDestSse(stream);
}

export default {
    buildServerSendEvent,
}
