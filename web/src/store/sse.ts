import { defineStore } from 'pinia';
import { sseUrl } from '@/config';
import { useEtcStore } from './etc';
import { message } from 'ant-design-vue';
import i18n from '@/i18n';
import { useDeviceStore } from '@/store/device';
let source: null | EventSource = null;

interface ISseState {
    sseIsConnect: boolean;
}
interface IToken {
    /** ip地址 */
    ip: string;
    /** mac地址 */
    mac: string;
    /** 名称 */
    name: string;
    /** 域名 */
    domain: string;
    /** 开始获取token的时间戳 */
    ts: string;
    /** 加密后凭证 */
    token: string;
    /** ip是否有效 */
    ipValid: boolean;
    /** 凭证是否有效 */
    tokenValid: boolean;
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
            console.log('SSE-------------------------------->');
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
            // 开始获取token
            source.addEventListener('begin_obtain_token_report', async (event: any) => {
                const data = JSON.parse(event.data);
                console.log('begin_obtain_token_report-------------> success',data);

                const deviceStore = useDeviceStore();
                deviceStore.getIHostGateWatList();
                deviceStore.getNsProGateWayInfo();
            });
            // 成功获取token
            source.addEventListener('obtain_token_success', async (event: any) => {
                const data = JSON.parse(event.data);
                console.log('obtain_token_success-------------> success',data);

                const deviceStore = useDeviceStore();
                deviceStore.getIHostGateWatList();
                deviceStore.getNsProGateWayInfo();
            });

            // 网关信息推送
            source.addEventListener('gateway_info_report', async (event: any) => {
                const data = JSON.parse(event.data);
                console.log('gateway_info_report-------------> success', data);
            });
            // 子设备信息变更
            source.addEventListener('device_info_change_report', async (event: any) => {
                const data = JSON.parse(event.data);
                console.log('device_info_change_report-------------> success', data);
            });
            // 子设备删除
            source.addEventListener('device_deleted_report', async (event: any) => {
                const data = JSON.parse(event.data);
                console.log('device_deleted_report-------------> success', data);
            });
            // 子设备新增
            source.addEventListener('device_added_report', async (event: any) => {
                const data = JSON.parse(event.data);
                console.log('device_added_report-------------> success', data);
            });
            source.addEventListener('error', async (event: any) => {
                console.log('SSE connect error, reboot');
                await this.startSse();
            });
        },

        async tryReconnection(type: 'reset' | 'restart', msg?: string) {
            const etcStore = useEtcStore();
            // const router = useRouter();

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
