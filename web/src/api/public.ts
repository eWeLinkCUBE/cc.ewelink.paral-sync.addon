import axios, { type AxiosRequestConfig } from 'axios';
import api from './index';
import EReqMethod from './ts/enum/EReqMethod';
import type IResponse from './ts/class/CResponse';
import { apiUrl, appSecret, appId, env } from '@/config';
import { useEtcStore } from '@/store/etc';
import cryptoJS from 'crypto-js';
import _ from 'lodash';
import i18n from '@/i18n';
import { message } from 'ant-design-vue';
import EEnv from '@/ts/enum/EEnv';

function getAuthSign(params: any) {
    let sign = '';
    let str = '';

    try {
        Object.keys(params)
            .sort()
            .forEach((key) => {
                const value = _.get(params, key);
                str += `${key}${typeof value === 'object' ? JSON.stringify(value) : value}`;
            });

        sign = cryptoJS
            .MD5(`${appSecret}${encodeURIComponent(str)}${appSecret}`)
            .toString()
            .toUpperCase();
    } catch (err) {
        console.log('got error here', err);
    }

    return sign;
}

//初始化axios设置
axios.defaults.baseURL = env === EEnv.PROD ? '/api/v1' : apiUrl;
axios.defaults.timeout = 15000;

//生成随机数
const chars = [
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
    'g',
    'h',
    'i',
    'j',
    'k',
    'l',
    'm',
    'n',
    'o',
    'p',
    'q',
    'r',
    's',
    't',
    'u',
    'v',
    'w',
    'x',
    'y',
    'z',
];

export function createNoce() {
    let result = '';
    for (let i = 0; i < 8; i++) {
        let num = Math.ceil(Math.random() * (chars.length - 1));
        result += chars[num];
    }
    return result;
}

export function createCommonHeader(type: EReqMethod, params: object) {
    const data: any = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        sign: `Sign ${getAuthSign(params)}`,
    };
    return data;
}

export function request<T>(url: string, params: object, methodType: EReqMethod) {
    return _httpGetPOSTPutDeleteRequest<T>(url, params, methodType);
}

async function _httpGetPOSTPutDeleteRequest<T>(url: string, params: object, methodType: EReqMethod) {
    const axiosConfig = {
        url,
        method: methodType,
        params,
    } as AxiosRequestConfig;

    const ts = Date.now();
    if (methodType === 'GET') {
        axiosConfig.params.appid = appId;
        axiosConfig.params.ts = ts;
    } else {
        axiosConfig.params = Object.assign(axiosConfig.params, { ts, appid: appId });
    }

    let headers = createCommonHeader(methodType, params);
    axiosConfig.headers = headers;

    if (methodType === EReqMethod.POST || methodType === EReqMethod.PUT || methodType === EReqMethod.DELETE) {
        delete axiosConfig.params;
        axiosConfig['data'] = params;
    }

    try {
        const result = await axios(axiosConfig);

        return result ? (result.data as IResponse<T>) : ({} as IResponse<T>);
    } catch (error) {
        console.log('error => ', error);

        // 报错中包含网络错误，即后端接口失效
        if (JSON.stringify(error).includes('Network Error') || JSON.stringify(error).includes('code 502')) {
            console.log('Network Error');
        }

        return {} as IResponse<T>;
    }
}
