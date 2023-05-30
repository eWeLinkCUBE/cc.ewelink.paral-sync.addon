import { defineStore } from 'pinia';
import i18n from '@/i18n';
import api from '@/api';
import { useDeviceStore } from './device';
interface IEtcState {
    language: 'zh-cn' | 'en-us';
    at: string;
    isLoading: boolean;
    autoSync:boolean
    isIPUnableToConnect:boolean
}

export const useEtcStore = defineStore('addon_etc', {
    state: (): IEtcState => {
        return {
            /** 国际化语言 */
            language: 'zh-cn',

            /** 登录凭证 */
            at: '',
            /** 控制context Loading变量 */
            isLoading: false,
            /** 自动同步新增设备状态 */
            autoSync:true,
            /** IP无法连接提示控制变量 */
            isIPUnableToConnect:false
        };
    },
    getters: {},
    actions: {
        /** 修改国际化语言 */
        languageChange(language: 'zh-cn' | 'en-us') {
            this.language = language;
            i18n.global.locale = language;
        },
        setAt(at: string) {
            this.at = at;
        },
        setAutoSyncStatus(state: boolean) {
            this.autoSync = state;
        },
        setIsLoading(state: boolean) {
            this.isLoading = state;
        },
        setIsIPUnableToConnect(state: boolean) {
            this.isIPUnableToConnect = state;
        },
    },
    persist: true,
});
