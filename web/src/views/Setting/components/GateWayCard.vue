<template>
    <div class="card">
        <div class="name">{{ gateWayData.name || 'Name' }}</div>
        <div class="ip">IP：{{ gateWayData.ip }}</div>
        <div class="mac">MAC：{{ gateWayData.mac }}</div>
        <a-button
            type="primary"
            style="width: 194px; height: 40px"
            @click="getToken(gateWayData.mac)"
            :disabled="gateWayData.tokenValid || !gateWayData.ipValid || disabledBtn ? true : false"
            :loading="btnStatus"
        >
            <span v-if="btnStatus">{{ formatCount(countdownTime) }}</span>
            <span v-else>{{ showWhichContent(gateWayData) }}</span>
        </a-button>
    </div>
</template>

<script setup lang="ts">
import type { IGateWayInfoData } from '@/api/ts/interface/IGateWay';
import api from '@/api/NSPanelPro/index';
import i18n from '@/i18n/index';
import moment from 'moment';
import { useDeviceStore } from '@/store/device';
const deviceStore = useDeviceStore();
const props = defineProps<{
    gateWayData: IGateWayInfoData;
    type: 'iHost' | 'nsPro';
}>();

const emits = defineEmits(['openNsProTipModal']);
const openNsProTipModal = () => emits('openNsProTipModal');

/** 获取token按钮的状态  获取token 、*/
const btnStatus = computed<boolean>(() => {
    if (!props.gateWayData) {
        return false;
    }
    const { tokenValid, ts } = props.gateWayData;
    const requestTime = Number(ts);
    //已经获取token
    if (tokenValid) {
        clearInterval(timer.value);
        return false;
    }

    //没有ts,显示获取token
    if (!requestTime) {
        return false;
    } else {
        //有ts,再判断距离当前时间是否小于五分钟
        const nowTime = moment();
        const seconds = moment(nowTime).diff(moment(requestTime), 'seconds');
        if (seconds > 300) {
            return false;
        } else {
            setCutDownTimer(requestTime);
            return true;
        }
    }
});

/**有一个nsPro在获取token倒计时或者已经获取token,按钮禁用*/
const disabledBtn = computed(() => {
    const hasOneTokenItem = deviceStore.nsProList.find((item) => item.tokenValid || item.ts);
    let notSelf = true;
    if (hasOneTokenItem && hasOneTokenItem.mac === props.gateWayData.mac) {
        notSelf = false;
    }
    return deviceStore.hasTokenOrTs && notSelf;
});

const timeGap = ref(300);
/** 倒计时时间 */
const countdownTime = ref(300);

const timer = ref<any>(null);

/** 按钮展示内容的控制 */
const showWhichContent = (gateWayData: IGateWayInfoData) => {
    //IP无效
    if (!gateWayData.ipValid) {
        return i18n.global.t('IP_FAILED');
    }
    //已获取token
    if (gateWayData.tokenValid) {
        return i18n.global.t('ALREADY_GET_TOKEN');
    }
    //获取token
    return i18n.global.t('GET_TOKEN');
};

/** 开始倒计时 */
const setCutDownTimer = (requestTime: number) => {
    const nowTime = moment();

    const seconds = moment(nowTime).diff(moment(requestTime), 'seconds');

    if (seconds > 300) return;
    countdownTime.value = 300 - seconds;

    if (timer.value) {
        window.clearInterval(timer.value);
    }

    countdownTime.value--;

    timer.value = window.setInterval(() => {
        if (countdownTime.value > 0) {
            countdownTime.value--;
        } else {
            window.clearInterval(timer.value);
            countdownTime.value = timeGap.value;
        }
        console.log('------------------>', countdownTime.value);
    }, 1000);
};

/**获取token */
const getToken = async (mac: string) => {
    if(props.type === 'nsPro'){
        openNsProTipModal();
    }
    const isSyncTarget = props.type === 'iHost' ? 1 : 0;
    const res = await api.getToken(mac, isSyncTarget);
    if (res.error === 0 && res.data) {
        if (props.type === 'iHost') {
            deviceStore.getIHostGateWatList();
        } else {
            deviceStore.getNsProGateWayInfo();
        }
    }
};

/** 格式化时间 */
const formatCount = (count: number) => {
    const min = Math.floor(count / 60);
    const sec = count % 60;
    return `${min}min${sec}s`;
};
</script>

<style scoped lang="scss">
.card {
    padding: 16px;
    width: 226px;
    height: 168px;
    box-shadow: 0px 0px 5px 0px rgba(136, 136, 136, 0.25);
    border-radius: 12px 12px 12px 12px;
    .name {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 11px;
    }
    .ip {
        margin-bottom: 6px;
        color: #a1a1a1;
    }
    .mac {
        margin-bottom: 10px;
        color: #a1a1a1;
    }
    img {
        margin: 20px 64px;
    }
    :deep(.ant-btn-primary[disabled]){
        background-color: #999999 !important;
        border: 1px solid rgba(153,153,153,0.3)!important;
        font-weight: 500!important;
        color: #FFFFFF!important;
        font-size: 16px!important;
    }
}
</style>
