import { defineStore } from 'pinia';
import {stepsList} from '@/api/ts/interface/IGateWay';
import api from '../api';
import _ from 'lodash';
import type { IGateWayInfoData , IAddDeviceData, INsProDeviceData} from '@/api/ts/interface/IGateWay';
import router from '@/router';
import moment from 'moment';
import { message } from 'ant-design-vue';

interface IDeviceState {
    /** 用户所处的步骤 */
    step:stepsList,
    /** IHost数据 */
    iHostList:IGateWayInfoData[],
    /** nsPro 数据 */
    nsProList:IGateWayInfoData[],
    /** 网关下所有的子设备 */
    deviceList: INsProDeviceData[],
    /** nsPro是否登录 */
    nsProLogin:boolean,
}

export const useDeviceStore = defineStore('addon_device', {
    state: (): IDeviceState => {
        return {
            step:stepsList.FIRST,
            iHostList:[],
            nsProList:[],
            deviceList:[],
            nsProLogin:false,
        };
    },
    actions: {
        /** 设置步骤 */
        setStep(step:stepsList){
            this.step = step;
        },

        /**获取iHost本机的网关信息*/
        async getIHostGateWatList(){
            const res = await api.NSPanelPro.getOurselfGateWayInfo();
            if(res.error === 0 && res.data){
                this.iHostList = [res.data];
            }else{
                this.iHostList = [];
            }
            console.log('res',res);
            return res;
        },

        /** 获取nsPro网关列表  */
        async getNsProGateWayList(){
            const res = await api.NSPanelPro.getNsProGateWayList();
            if(res.error === 0 && res.data){
                this.nsProList = res.data;
            }else{
                this.nsProList = [];
            }
            return res;
        },

        /** 获取nsPro网关下所有的子设备 */
        async getDeviceList(){
            let mac = '';
            this.nsProList.forEach((item)=>{
                if(item.tokenValid && item.ipValid){
                    mac = item.mac;
                }
            });

            if(!mac){
                router.push('/setting');
                return;
            };

            const res = await api.NSPanelPro.getDeviceList(mac);
            if (res.error === 0 && res.data) {
                this.nsProLogin = true;
                this.deviceList = res.data;
                this.deviceList.map((device) => {
                    return device.spinLoading=false;
                });
            }else{
                this.deviceList = [];
                if(res.error === 1400){
                    this.nsProLogin = false;
                }
            }
            return res;
        },

        /** 设置loading转圈 */
        setLoading(item:INsProDeviceData,status:boolean){
            if(!item.id || this.deviceList.length<1)return;
            this.deviceList.map((device)=>{
                if(device.id === item.id){
                    device.spinLoading=status;
                }
            });
        },

        /** 根据id去修改nsPro的数据列表（同步的时候不再查询列表） */
        modifyNsProListById(id:string|number,status:boolean){
            if(this.deviceList.length<1)return;
            this.deviceList.map((item)=>{
                if(item.id === id){
                    item.isSynced = status;
                }
            })
        },

        /** sse 直接替换iHost或者nsPro的列表数据 */
        replaceGateWayItemBySse(item:IGateWayInfoData){
            if(!item || !item.mac) return;
            //mac地址唯一,直接匹配;
            this.iHostList = this.iHostList.map((device)=>{
                return device.mac === item.mac ? item :device;
            });
            this.nsProList = this.nsProList.map((element)=>{
                return element.mac === item.mac ? item :element;
            });
        },

        /** nsPanePro网关信息推送（区分新增还是修改）*/
        modifyGateWayInfoBySse(item:IGateWayInfoData){
            //根据mac地址判断是修改还是新增的网关信息;
            const isExistGateWay = this.nsProList.some((ele)=>ele.mac === item.mac);
            if(isExistGateWay){
                this.nsProList = this.nsProList.map((ele) => {
                    return ele.mac === item.mac ? item : ele;
                });
            }else{
                this.nsProList.push(item);
            }
        },

        /** 子设备信息变更，根据SSE修改本地设备上下线或者改名 */
        replaceDeviceItemBySse(item:INsProDeviceData){
            if(!item || !item.id) return;
            item.spinLoading = false;
            this.deviceList = this.deviceList.map((ele) => {
                return ele.id === item.id ? item : ele;
            });
        },

        /** 删除nsPro下的设备 */
        deleteNsProDeviceById(deviceId:string|number){
            if(!deviceId || this.deviceList.length<1)return;
            this.deviceList = this.deviceList.filter((item)=>item.id!==deviceId);
        },

        /** 新增子设备 */
        addNsPaneProDevice(device:IAddDeviceData){
            if(!device)return;
            const isExistDevice = this.deviceList.some((item)=>item.id === device.id);
            //已经存在不重复添加;
            if(isExistDevice)return;
            //loading状态
            device.spinLoading = false;
            this.deviceList.push(device);
        }
    },
    getters: {
        /** 已经有一个网关获取到token或者在倒计时 */
        hasTokenOrTs(state) {
            const hasTokenOrTs = state.nsProList.some((item) => {
                if (item.tokenValid && item.ipValid) {
                    return true;
                }
                if (item.ts && item.ipValid) {
                    const timeGap = moment(moment()).diff(moment(Number(item.ts)), 'seconds');
                    if (timeGap <= 300 && timeGap >= 0) {
                        return true;
                    }
                }
                return false;
            });
            return hasTokenOrTs;
        },
        /** iHost网关的IP有效,iHost只有一个*/
        effectIHostIp(state){
            return state.iHostList.some((item)=>item.ipValid);
        },
        /** iHost网关的token有效,iHost只有一个 */
        effectIHostToken(state){
            return state.iHostList.some((item)=>item.tokenValid);
        },
        /** nsPro网关存在至少一个失效的IP */
        hasOneInvalidNsProIP(state){
            return state.nsProList.some((item)=>!item.ipValid);
        },
        /** nsPro网关存在至少一个失效的token */
        hasOneInvalidNsProToken(state){
            return state.nsProList.some((item)=>(!item.tokenValid && item.token));
        },
    },
    persist: true,
});
