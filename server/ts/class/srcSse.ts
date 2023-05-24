import _ from "lodash";
import logger from "../../log";
import EventSource from "eventsource";
import { IAddDevice, IDeviceDeleted, IDeviceInfoUpdate, IDeviceOnOrOffline, IDeviceStateUpdate } from "../interface/ISse";
import sseUtils from "../../utils/sseUtils";
import tools from "../../utils/tools";
import db, { IGatewayInfoItem } from "../../utils/db";
import { srcTokenAndIPInvalid } from "../../utils/dealError";


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
     * @memberof ServerSentEvent
     */
    private _initUniversalEvent() {
        return new Promise(resolve => {
            this.source.onopen = async (event) => {
                logger.info(`init ${this.connectionId} sse success`, event);
                this.status = ESseStatus.OPEN;
                this._initGatewayEvent();
                resolve(true);
            }
            this.source.onerror = async (event) => {
                logger.info('init sse error', event)
                // 将相关设备下线
                await srcTokenAndIPInvalid("ip", this.initParams.mac);
                this.status = ESseStatus.RECONNECTING;
                // 开始重连
                await this._reconnectSse();
                resolve(false);
            }
        })
    }

    /**
     * @description 初始化监听事件
     * @memberof ServerSentEvent
     */
    private _initGatewayEvent() {
        /** 新增设备 */
        this.source.addEventListener('device#v1#addDevice', (event) => {
            const { payload } = JSON.parse(event.data) as IAddDevice;
            logger.info(`sse ${this.connectionId} trigger new device ${payload.serial_number} added`)
            // 同步设备
            sseUtils.syncOneDevice(payload, this.initParams.mac);
        })

        /** 设备状态更新 */
        this.source.addEventListener('device#v1#updateDeviceState', (event) => {
            const { payload, endpoint } = JSON.parse(event.data) as IDeviceStateUpdate;
            sseUtils.updateOneDevice({ type: 'state', mac: this.connectionId, payload, endpoint }, this.initParams.mac);
        })

        /** 设备信息更新 */
        this.source.addEventListener('device#v1#updateDeviceInfo', (event) => {
            const { payload, endpoint } = JSON.parse(event.data) as IDeviceInfoUpdate;
            sseUtils.updateOneDevice({ type: 'info', mac: this.connectionId, payload, endpoint }, this.initParams.mac);
        })

        /** 设备上下线 */
        this.source.addEventListener('device#v1#updateDeviceOnline', (event) => {
            const { payload, endpoint } = JSON.parse(event.data) as IDeviceOnOrOffline;
            sseUtils.updateOneDevice({ type: 'online', mac: this.connectionId, payload, endpoint }, this.initParams.mac);
        })

        /** 设备被删除 */
        this.source.addEventListener('device#v1#deleteDevice', (event) => {
            const { endpoint } = JSON.parse(event.data) as IDeviceDeleted;
            // 取消同步设备
            sseUtils.deleteOneDevice(endpoint, this.initParams.mac);
        })
    }
    /**
     * @description 重连sse
     * @memberof ServerSentEvent
     */
    private async _reconnectSse() {
        // 不论成功或失败 每个长连接实例都只会重试10次
        for (; this.retryCount < this.maxRetry;) {
            const retryCount = this.retryCount + 1;
            if (this.status !== ESseStatus.OPEN) {
                // 每次重连之前都关闭连接
                this.source.close();
                console.log(`sse reconnecting for ${retryCount} 次`);
                console.log(`sse reconnect for ${retryCount} times begins in ${Date.now()}`);
                // 尝试重连
                const { ip, token } = this.initParams;
                this.source = new EventSource(`http://${ip}/open-api/v1/sse/bridge?access_token=${token}`);
                const res = await this._initUniversalEvent();
                if (!res) {
                    console.log(`sse reconnect for ${retryCount} time fails in ${Date.now()}`);
                    this.retryCount++;
                    if (retryCount + 1 > this.maxRetry) {
                        console.log(`reach the max retry count`);
                    } else {
                        console.log(`wait fo the ${retryCount + 1} times reconnection ${Date.now()}`);
                    }
                    // 最大重试间隔为2小时
                    const actualInterval = this._getRetryInterval(this.retryInterval);
                    await tools.sleep(actualInterval);
                    continue;
                }
            }
            console.log(`sse reconnect for ${retryCount} 次成功`);
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
     * @param {IGatewayInfoItem} params
     * @memberof ServerSentEvent
     */
    updateSseParams(params: IGatewayInfoItem) {
        this.initParams = params;
    }
}

async function buildServerSendEvent(gateway: IGatewayInfoItem) {
    const stream = new ServerSentEvent(gateway);
    const ssePool = await db.getDbValue("ssePool");
    ssePool.set(stream.connectionId, stream);
    logger.info(`gateway sse connections count:${ssePool.size}`);
}

export default {
    buildServerSendEvent,
}