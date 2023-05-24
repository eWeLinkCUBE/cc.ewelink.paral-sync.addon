import { defineStore } from 'pinia';
import type { IBeforeLoginDevice, IAfterLoginDevice } from '@/ts/interface/IDevice';
import {stepsList} from '@/api/ts/interface/IGateWay';
import api from '../api';
import _ from 'lodash';
import type { IGateWayInfoData , INsProDeviceData} from '@/api/ts/interface/IGateWay';
import router from '@/router';

interface IDeviceState {
    /** 登录前的设备列表 */
    beforeLoginDeviceList: IBeforeLoginDevice[];
    /** 登录后的设备列表 */
    afterLoginDeviceList: IAfterLoginDevice[];
    /** 登录前轮询设备列表的返回值 */
    beforeLoginDeviceListInterval: number;
    /** 登录后轮询设备列表的返回值 */
    afterLoginDeviceListInterval: number;
    /** 用户是否打开隐藏不可用的设备 */
    isFilter: boolean;
    /** 网关缺少凭证时弹框后确认凭证重启调用同步接口需要的设备Id */
    waitSyncDeviceId: string;
    /** 用户所处的步骤 */
    step:stepsList,
    /** Ihost数据 */
    iHostList:IGateWayInfoData[],
    /** nspro 数据 */
    nsProList:IGateWayInfoData[],
    /** 网关下所有的子设备 */
    deviceList: INsProDeviceData[],
}

export const useDeviceStore = defineStore('addon_device', {
    state: (): IDeviceState => {
        return {
            beforeLoginDeviceList: [],
            afterLoginDeviceList: [],
            beforeLoginDeviceListInterval: 0,
            afterLoginDeviceListInterval: 0,
            isFilter: false,
            waitSyncDeviceId: '',
            step:stepsList.FIRST,
            iHostList:[],
            nsProList:[],
            deviceList:[],
        };
    },
    actions: {
        async getBeforeLoginDeviceList() {
            // const res = await api.NSPanelPro.getAllLanDeviceBeforeLogin();
            // if (res.data && res.error === 0) {
            //     this.beforeLoginDeviceList = res.data.deviceList;
            // }
        },
        async getAfterLoginDeviceList(forceRefresh:boolean = false) {
            const res = await api.NSPanelPro.getAllLanDeviceAfterLogin(forceRefresh);

            if (res.data && res.error === 0) {
                const isMyAccountDeviceList = res.data.deviceList.filter((item) => {
                    return item.isMyAccount&&item.isSupported;
                });
                const noMyAccountDeviceList = res.data.deviceList.filter((item) => {
                    return !item.isMyAccount;
                });
                const isNotSupportedDeviceList = res.data.deviceList.filter((item) => {
                    return item.isMyAccount&&!item.isSupported;;
                });
                // this.afterLoginDeviceList = res.data.deviceList;
                this.afterLoginDeviceList = [...isMyAccountDeviceList, ...noMyAccountDeviceList, ...isNotSupportedDeviceList];
            }
            return res
            // if (res.data && res.error === 0) {
            //     this.afterLoginDeviceList = res.data.deviceList;
            // }
        },
        setBeforeLoginDeviceListInterval(num: number) {
            this.beforeLoginDeviceListInterval = num;
        },
        setAfterLoginDeviceListInterval(num: number) {
            this.afterLoginDeviceListInterval = num;
        },
        setIsFilter(state: boolean) {
            this.isFilter = state;
        },
        setWaitSyncDeviceId(deviceId: string) {
            this.waitSyncDeviceId = deviceId;
        },
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
        },
        /** 获取nspro  */
        async getNsProGateWayInfo(){
            const res = await api.NSPanelPro.getNsProGateWayInfo();
            if(res.error === 0 && res.data){
                this.nsProList = res.data;
            }
        },
        /** 设置卡片的倒计时时间 */
        setCountDownTime(time:number){

        },
        /** 获取网关下所有的子设备 */
        async getDeviceList(){
            let mac = '';
            this.nsProList.map((item)=>{
                if(item.tokenValid && item.token){
                    mac = item.mac;
                }
            });
            
            if(!mac)return;

            const res = await api.NSPanelPro.getDeviceList(mac);

            if (res.error === 0 && res.data) {
                this.deviceList = res.data;
            }

            if (res.error === 1401) {
                router.push('/setting');
            }
        }
    },

    getters: {
        filterAfterLoginDeviceList(state) {
            return state.afterLoginDeviceList.filter((device) => {
                return device.isMyAccount && device.isSupported;
            });
        },
    },
    persist: true,
});
