import { Request, Response } from 'express';
import _ from 'lodash';
import { v4 as uuid } from 'uuid';
import logger from '../../log';

interface ISendEvent {
    /** 事件名称 例如：change_report */
    name: string;
    /** 时间数据 例如 {设备数据} */
    data: any;
}


const ssePool = new Map();
class ServerSendStream {
    public connectionId: string;
    private retryInterval: number;
    // public eventStream: PassThrough;
    private heartbeat: NodeJS.Timer | null;
    private req: Request;
    private res: Response;

    constructor(req: Request, res: Response) {
        this.connectionId = uuid();
        this.retryInterval = 20 * 1000;
        this.heartbeat = null;
        this.req = req;
        this.res = res;
        this.configureLifecycle();
    }
    configureLifecycle() {
        this.res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
            'Connection': 'keep-alive'
        });

        this.heartbeat = setInterval(() => {
            this.res.write(`data:\n\n`);
        }, this.retryInterval);
        this.req.on('close', () => {
            ssePool.delete(this.connectionId);
            clearInterval(this.heartbeat!);
            logger.info('sse connection close');
        });
        this.req.on('finish', () => {
            ssePool.delete(this.connectionId);
            clearInterval(this.heartbeat!);
            logger.info('sse connection finish');
        });
        this.req.on('error', () => {
            ssePool.delete(this.connectionId);
            clearInterval(this.heartbeat!);
            logger.error('sse connection error');
        });
        this.res.write(`retry: ${this.retryInterval}\n\n`);
    }
    publish(event: any) {
        const formattedData = typeof event.data === 'string' ? event.data : JSON.stringify(event.data);
        const payload = `event: ${event.name}\ndata: ${formattedData}\n\n`;
        this.res.write(payload);
    }
}

function buildStreamContext(req: Request, res: Response) {
    const stream = new ServerSendStream(req, res);
    ssePool.set(stream.connectionId, stream);
    logger.info(`sse connections count:${ssePool.size}`);
}

/**
 * 
 * @param {object} event 
 * @param {String} event.name  事件名称 例如：change_report
 * @param {Object} event.data  时间数据 例如 {设备数据}
 */
function send(event: ISendEvent) {
    //广播数据
    for (const entry of ssePool.entries()) {
        const sse = entry[1];
        try {
            logger.debug(`connectionId:${entry[0]} - data:${JSON.stringify(event)}`);
            sse.publish(event);
        } catch (error) {
            logger.error(`sse connectionId:${sse.connectionId} send event:${JSON.stringify(event)} error:${error}`);
        }
    }
}


export default {
    buildStreamContext,
    send,
};
