

import axios from 'axios';
import NSPanelPro from './NSPanelPro';
import { useEtcStore } from '@/store/etc';
import ErrorCodeHandle from '@/utils/ErrorCodeHandle';
import { emitter } from '@/main';
import { useDeviceStore } from '@/store/device';

/**
 * @description 存在at时，必须先调用该方法 初始化at When at exists, this method must be called first to initialize at
 * @param {string} at
 */
function init(at: string) {
    const etc = useEtcStore();
    etc.setAt(at);
}


/**
 * @description 获取 at get at
 * @returns {*} 
 */
function getAt() {
    const etc = useEtcStore();
    return etc.at;
}

/**
 * 添加响应拦截器,用于抛出事件给前端异常处理
 * 专门用来处理通用错误返回码
 * Add a response interceptor to throw events to the front-end exception handling
 * Specifically used to handle common error return codes
 */
axios.interceptors.response.use((response): any => {
    // console.log('GavinLog ~ axios.interceptors.response.use ~ response', response);
    // console.log('response', response);
    const deviceStore = useDeviceStore();

    if (response) {
        const {
            status,
            data,
            config: { url },
        } = response;

        const { error } = data;
        const skipCommonError = url && url.includes("initiate-with-offer");

        // 每次请求将ip和token置为有效，ErrorCodeHandle方法中出现指定错误时置为无效
        // The IP and token are set to be valid for each request, and are set to be invalid when a specified error occurs in the error code handle method.
        if (!url?.includes('auto-sync')) {
            deviceStore.setIpTokenStatus(true);
            deviceStore.setIpTokenMsg('');
            deviceStore.setIpTokenStep(deviceStore.step);
        }


        if (url && status === 200 && error && error != 0 && error.toString().length === 3) {
            if (skipCommonError && error === 500) return response;
        }

        // 业务接口错误码统一消息提示
        // Business interface error code unified message prompt
        if (url && status === 200 && error && error != 0 && !skipCommonError) {
            // console.log('emit errCode handler --------->',error);
            ErrorCodeHandle(error);
        }
    }

    return response;
});


let IS_SET_EVENT: boolean = false;

/**
 * @description 监听事件 Listen for events
 * @param {EventListener} callback
 */
function setEventCallback(callback: EventListener) {
    if (!IS_SET_EVENT) {
        // console.log(`setEventCallback 开始监听通用错误处理`);
        IS_SET_EVENT = true;
        emitter.on(`COMMON_ERROR_EVENT`, callback);
    } else {
        console.log(`The universal error listener already exists and duplicate creation is prohibited.`);
    }
}

/**
 * @description
 * Remove event listener
 * Note: callback must be the same object as the callback in the set event callback formal parameter
 * @param {EventListener} callback
 */
function cleanEventCallback(callback: EventListener) {
    emitter.removeListener(`COMMON_ERROR_EVENT`, callback);
    IS_SET_EVENT = false;
}

export default {
    init,
    getAt,
    setEventCallback,
    cleanEventCallback,
    NSPanelPro,
};
