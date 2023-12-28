import { defineStore } from 'pinia';
import { stepsList } from '@/api/ts/interface/IGateWay';
import api from '../api';
import _ from 'lodash';
import type { IGateWayInfoData, IAddDeviceData, INsProDeviceData } from '@/api/ts/interface/IGateWay';
import router from '@/router';
import moment from 'moment';

interface IDeviceState {
    /** 
    * 用户所处的步骤
    * The step the user is at
    */
    step: stepsList;
    /** 
    * IHost数据
    * IHost data
    */
    iHostList: IGateWayInfoData[];
    /** 
    * nsPro 数据
    * nsPro data
    */
    nsProList: IGateWayInfoData[];
    /** 
    * 网关下所有的子设备
    * All sub-devices under the gateway
    */
    deviceList: INsProDeviceData[];
    /** 
    * ip和token有效状态
    * IP and token valid status
    */
    ipToken: boolean;
    /** 
    * ip和token失效的提示语
    * Prompt message for invalid IP and token
    */
    ipTokenMsg: string;
    /** 
    * ip和token发生错误的步骤
    * Steps for IP and token errors
    */
    ipTokenStep: stepsList;
    /** 
    * 累加查询次数
    * Accumulated query times
    */
    retryTime:number,
}

export const useDeviceStore = defineStore('addon_device', {
    state: (): IDeviceState => {
        return {
            step: stepsList.FIRST,
            iHostList: [],
            nsProList: [],
            deviceList: [],
            ipToken: true,
            ipTokenMsg: '',
            ipTokenStep: stepsList.FIRST,
            retryTime:0
        };
    },
    actions: {
        /** 
        * 设置步骤
        * Setup steps
        */
        setStep(step: stepsList) {
            this.step = step;
        },

        /**
        * 获取iHost本机的网关信息
        * Obtain the gateway information of the iHost machine
        */
        async getIHostGateWatList() {
            const res = await api.NSPanelPro.getOurselfGateWayInfo();
            if (res.error === 0 && res.data) {
                this.iHostList = [res.data];
            } else {
                this.iHostList = [];
            }
            return res;
        },

        /** 
        * 获取nsPro网关列表
        * Get ns pro gateway list
        */
        async getNsProGateWayList() {
            const res = await api.NSPanelPro.getNsProGateWayList();
            if (res.error === 0 && res.data) {
                this.nsProList = res.data;
            } else {
                this.nsProList = [];
            }
            return res;
        },

        /** 
        * 获取nsPro网关下所有的子设备  0:普通刷新 、1:强制刷新缓存
        * Get all sub-devices under nsPro gateway 0: normal refresh, 1: forced cache refresh
        */
        async getDeviceList(isForceRefresh = '0') {
            let mac = '';
            this.nsProList.forEach((item) => {
                if (item.tokenValid && item.ipValid) {
                    mac = item.mac;
                }
            });

            if (!mac) {
                // console.log('nsPro Gateway mac lose');
                this.deviceList = [];
                // this.setStep(stepsList.FIRST);
                // router.push('/setting');
                return;
            }

            const res = await api.NSPanelPro.getDeviceList(mac,isForceRefresh);
            this.deviceList = [];
            if (res.error === 0 && res.data) {
                this.deviceList = res.data;
                this.deviceList.map((device) => {
                    return (device.spinLoading = false);
                });
            }
            return res;
        },

        /** 
        * 设置loading转圈
        * Set loading rotation
        */
        setLoading(item: INsProDeviceData, status: boolean) {
            if (!item.id || this.deviceList.length < 1) return;
            this.deviceList.map((device) => {
                if (device.id === item.id) {
                    device.spinLoading = status;
                }
            });
        },

        /** 
        * 根据id去修改nsPro的数据列表同步状态数据（同步的时候不再查询列表接口）
        * Modify NS Pro's data list synchronization status data based on ID (the list interface will no longer be queried during synchronization)
        */
        modifyDeviceSyncStatusById(id: string | number, status: boolean) {
            if (this.deviceList.length < 1) return;
            this.deviceList.map((item) => {
                if (item.id === id) {
                    item.isSynced = status;
                }
            });
        },

        /** 
        * sse 直接替换iHost或者nsPro的列表数据
        * sse directly replaces the list data of iHost or nsPro
        */
        replaceGateWayItemBySse(item: IGateWayInfoData) {
            if (!item || !item.mac) return;
            // mac地址唯一，直接匹配 Mac address is unique and directly matched
            this.iHostList = this.iHostList.map((device) => {
                return device.mac === item.mac ? item : device;
            });
            this.nsProList = this.nsProList.map((element) => {
                return element.mac === item.mac ? item : element;
            });
        },

        /** 
        * nsPanePro网关信息推送（区分新增还是修改）
        * Ns pane pro gateway information push (distinguish between new addition or modification)
        */
        modifyGateWayInfoBySse(item: IGateWayInfoData) {
            // 根据mac地址判断是修改还是新增的网关信息 Determine whether the gateway information is modified or added based on the mac address
            const isExistGateWay = this.nsProList.some((ele) => ele.mac === item.mac);
            if (isExistGateWay) {
                this.nsProList = this.nsProList.map((ele) => {
                    return ele.mac === item.mac ? item : ele;
                });
            } else {
                this.nsProList.push(item);
            }
        },

        /** 
        * 子设备信息变更，根据SSE修改本地设备上下线或者改名
        * Sub-device information changes, modify local device online and offline or rename according to sse
        */
        replaceDeviceItemBySse(item: INsProDeviceData) {
            if (!item || !item.id) return;
            item.spinLoading = false;
            this.deviceList = this.deviceList.map((ele) => {
                return ele.id === item.id ? item : ele;
            });
        },

        /** 
        * 删除nsPro下的设备
        * Delete devices under ns pro
        */
        deleteNsProDeviceById(deviceId: string | number) {
            if (!deviceId || this.deviceList.length < 1) return;
            this.deviceList = this.deviceList.filter((item) => item.id !== deviceId);
        },

        /** 
        * 新增子设备
        * Add new sub-device
        */
        addNsPaneProDevice(device: IAddDeviceData) {
            if (!device) return;
            const isExistDevice = this.deviceList.some((item) => item.id === device.id);
            if (isExistDevice) return;
            device.spinLoading = false;
            this.deviceList.push(device);
        },

        /** 
        * 设置ip和token是否有效的提示
        * Tips for setting whether the IP and token are valid
        */
        setIpTokenStatus(ipToken: boolean) {
            this.ipToken = ipToken;
        },

        /** 
        * 设置提示页面的ip和token的提示语
        * Set the prompt page's IP and token prompts
        */
        setIpTokenMsg(ipTokenMsg: string) {
            this.ipTokenMsg = ipTokenMsg;
        },

        /** 
        * 设置ip和token失效时候该去的步骤
        * Steps to take when setting IP and token expire
        */
        setIpTokenStep(ipTokenStep: stepsList) {
            this.ipTokenStep = ipTokenStep;
        },

        /** 
        * 设置累加次数
        * Set the number of accumulations
        */
        setRetryTime(){
            this.retryTime++;
        },

        /** 
        * 重置查询次数
        * Reset query count
        */
        reverseRetryTime(){
            this.retryTime = 0;
        }
    },
    getters: {
        /** 
        * 已经有一个网关获取到token或者在倒计时
        * There is already a gateway that has obtained the token or is counting down.
        */
        hasTokenOrTs(state) {
            const hasTokenOrTs = state.nsProList.some((item) => {
                if (item.tokenValid && item.ipValid) {
                    return true;
                }
                if (item.ts && item.ipValid) {
                    const timeGap = moment(moment()).diff(moment(Number(item.ts)), 'seconds');
                    if (timeGap < 300) {
                        // console.log('hasTokenOrTs  true');
                        return true;
                    }
                }
                return false;
            });
            return hasTokenOrTs;
        },
        /** 
        * iHost网关的IP有效,iHost只有一个
        * The IP of the IHost gateway is valid, and there is only one iHost
        */
        effectIHostIp(state) {
            return state.iHostList.some((item) => item.ipValid);
        },
        /** 
        * iHost网关的token有效,iHost只有一个
        * The token of IHost gateway is valid, and there is only one iHost
        */
        effectIHostToken(state) {
            return state.iHostList.some((item) => item.tokenValid);
        },
        /** 
        * iHost的token失效，曾经获取过token
        * The token of IHost is invalid and the token has been obtained before.
        */
        iHostTokenFail(state) {
            return state.iHostList.some((item) => !item.tokenValid && item.token);
        },
        /** 
        * nsPro网关存在至少一个失效的IP 
        * There is at least one invalid IP in Ns pro gateway
        */
        hasOneInvalidNsProIP(state) {
            return state.nsProList.some((item) => !item.ipValid);
        },
        /** 
        * nsPro网关存在至少一个失效的token
        * There is at least one invalid token in Ns pro gateway
        */
        hasOneInvalidNsProToken(state) {
            return state.nsProList.some((item) => !item.tokenValid && item.token);
        },
    },
    persist: true,
});
