import { defineStore } from 'pinia';
import { sseUrl } from '@/config';
import { useEtcStore } from './etc';
import { message } from 'ant-design-vue';
import i18n from '@/i18n';
import { useDeviceStore } from '@/store/device';
import type {
    IGateWayInfoData,
    INsProDeviceData,
    IDeleteDeviceData,
    IAddDeviceData
} from '@/api/ts/interface/IGateWay';
let source: null | EventSource = null;

interface ISseState {
    sseIsConnect: boolean;
}

export const useSseStore = defineStore('sse', {
    state: (): ISseState => {
        return {
            sseIsConnect: false,
        };
    },
    actions: {
        setSseIsConnect(state: boolean) {
            this.sseIsConnect = state;
        },

        async startSse() {
            console.log('start SSE');
            if (source) source.close();
            const timestamp = new Date().getTime();
            source = new EventSource(`${sseUrl}?id=${timestamp}`);
            source.addEventListener('open', () => {
                const etcStore = useEtcStore();
                console.log('SSE connect success');
                this.sseIsConnect = true;
                if (etcStore.isLoading) {
                    etcStore.setIsLoading(false);
                }
            });

            /** 开始获取token */
            source.addEventListener('begin_obtain_token_report', async (event: any) => {
                console.log('begin_obtain_token_report------------->', event.data);
                const data = JSON.parse(event.data) as IGateWayInfoData;
                const deviceStore = useDeviceStore();
                deviceStore.replaceGateWayItemBySse(data);
            });

            /**成功获取token */
            source.addEventListener('obtain_token_success_report', async (event: any) => {
                console.log('obtain_token_success------------->', event.data);
                const data = JSON.parse(event.data) as IGateWayInfoData;
                const deviceStore = useDeviceStore();
                deviceStore.replaceGateWayItemBySse(data);
            });

            /**获取token失败 */
            source.addEventListener('obtain_token_fail_report', async (event: any) => {
                console.log('obtain_token_fail_report---------->',event.data);
                const data = JSON.parse(event.data) as IGateWayInfoData;
                const deviceStore = useDeviceStore();
                deviceStore.replaceGateWayItemBySse(data);
            });

            /** 网关信息推送 */
            source.addEventListener('gateway_info_report', async (event: any) => {
                console.log('gateway_info_report-------------> success', event.data);
                const data = JSON.parse(event.data) as IGateWayInfoData;
                const deviceStore = useDeviceStore();
                deviceStore.modifyGateWayInfoBySse(data);
            });

            /**子设备信息变更 上下线和名字变化 */
            source.addEventListener('device_info_change_report', async (event: any) => {
                console.log('device_info_change_report-------------> success', event.data);
                const data = JSON.parse(event.data) as INsProDeviceData;
                const deviceStore = useDeviceStore();
                deviceStore.replaceDeviceItemBySse(data);
            });

            /** 子设备删除 */
            source.addEventListener('device_deleted_report', async (event: any) => {
                console.log('device_deleted_report-------------> success', event.data);
                const data = JSON.parse(event.data) as IDeleteDeviceData;
                const deviceStore = useDeviceStore();
                deviceStore.deleteNsProDeviceById(data.deviceId);
            });

            /** 子设备新增 */
            source.addEventListener('device_added_report', async (event: any) => {
                console.log('device_added_report-------------> success', event.data);
                const data = JSON.parse(event.data) as IAddDeviceData;
                const deviceStore = useDeviceStore();
                deviceStore.addNsPaneProDevice(data);
            });

            /** SSE失败 */
            source.addEventListener('error', async (event: any) => {
                console.log('SSE connect error, reboot');
                await this.startSse();
            });
        },

        async tryReconnection(type: 'reset' | 'restart', msg?: string) {
            const etcStore = useEtcStore();

            const sseTimer = setInterval(async () => {
                console.log('reconnecting...');

                this.startSse();
                if (this.sseIsConnect) {
                    clearInterval(sseTimer);
                    etcStore.setIsLoading(false);
                    if (type === 'reset') {
                        message.success(i18n.global.t(msg!));
                    }
                }
            }, 1000);
        },
    },
    persist: true,
});
