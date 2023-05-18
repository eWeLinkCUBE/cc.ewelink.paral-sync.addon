import { Request, Response } from "express";
import _ from "lodash";
import { v4 as uuid } from 'uuid';
import logger from "../../log";
import EventSource from "eventsource";
import { IAddDevice, IDeviceDeleted, IDeviceInfoUpdate, IDeviceOnOrOffline, IDeviceStateUpdate } from "../interface/ISse";
import sseUtils from "../../utils/sseUtils";
import IGatewayInfo from "../interface/IGatewayInfo";


interface ISendEvent {
    /** 事件名称 例如：change_report */
    name: string;
    /** 时间数据 例如 {设备数据} */
    data: any;
}


const ssePool = new Map();
class ServerSentEvent {
    public connectionId: string;
    private source: EventSource;

    constructor(ip: string, token: string, mac: string) {
        this.connectionId = mac;
        this.source = new EventSource(`http://${ip}/open-api/v1/sse/bridge?access_token=${token}`);
        // 初始化通用事件
        this.initUniversalEvent();
        // 初始化网关事件
        this.initGatewayEvent();
    }
    initUniversalEvent() {
        this.source.onopen = (event) => {
            logger.info(`init ${this.connectionId} sse success`, event);
        }
        this.source.onerror = async (event) => {
            logger.info('init sse error', event)
            // TODO 重连并且将设备相关所有设备全部下线
        }
    }
    initGatewayEvent() {
        /** 新增设备 */
        this.source.addEventListener('device#v1#addDevice', (event) => {
            const { payload } = JSON.parse(event.data) as IAddDevice;
            // 同步设备
            sseUtils.syncOneDevice(payload);
        })

        /** 设备状态更新 */
        this.source.addEventListener('device#v1#updateDeviceState', (event) => {
            const { payload } = JSON.parse(event.data) as IDeviceStateUpdate;
        })

        /** 设备信息更新 */
        this.source.addEventListener('device#v1#updateDeviceInfo', (event) => {
            const { payload } = JSON.parse(event.data) as IDeviceInfoUpdate;

        })

        /** 设备上下线 */
        this.source.addEventListener('device#v1#updateDeviceOnline', (event) => {
            const { payload } = JSON.parse(event.data) as IDeviceOnOrOffline;
        })

        /** 设备被删除 */
        this.source.addEventListener('device#v1#deleteDevice', (event) => {
            const { endpoint } = JSON.parse(event.data) as IDeviceDeleted;
            // 取消同步设备

        })
    }
}

function buildStreamContext(gateway: IGatewayInfo) {
    const { ip, mac} = gateway;
    const stream = new ServerSentEvent(ip, "ss", mac);
    ssePool.set(stream.connectionId, stream);
    logger.info(`sse connections count:${ssePool.size}`);
}


export default {
    buildStreamContext,
}