<template>
    <div class="card" :class="{ disabled: gateWayData.tokenValid || !gateWayData.ipValid || disabledBtn }">
        <div class="name">{{ gateWayData.name || 'Name' }}</div>
        <div class="ip">IP：{{ formatIp }}</div>
        <div class="mac">MAC：{{ gateWayData.mac }}</div>
        <a-button
            type="primary"
            style="width: 194px; height: 40px"
            @click="getToken(gateWayData.mac)"
            :disabled="gateWayData.tokenValid || !gateWayData.ipValid || disabledBtn ? true : false"
            :loading="btnLoadingStatus"
            :style="dynamicBtnColor"
        >
            <span v-if="btnLoadingStatus">{{ formatCount(countdownTime) }}</span>
            <span v-else>{{ showWhichContent }}</span>
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
const dynamicBtnColor = computed(() => {
    // ip失效，灰色 IP invalid, gray
    if (!props.gateWayData.ipValid) {
        return { 'background-color': '#999999 !important' };
    }
    // 已经获取一个token，按钮淡蓝色 A token has been obtained, the button is light blue
    if (props.gateWayData.tokenValid) {
        return { 'background-color': '#FFFFFF !important', color: '#1890FF!important' };
    }

    // 有一个nsPro在倒计时，按钮淡蓝色 There is an ns pro counting down, the button is light blue
    if (disabledBtn.value) {
        return { 'background-color': '#1890FF!important', opacity: '0.5!important' };
    }
    return {};
});

/** 
* 获取token按钮的状态  获取token
* Get the status of the token button Get the token
*/
const btnLoadingStatus = computed<boolean>(() => {
    clearInterval(timer.value);
    if (!props.gateWayData) {
        return false;
    }
    const { tokenValid, ts } = props.gateWayData;
    const requestTime = Number(ts);
    // 已经获取token Already obtained token
    if (tokenValid) {
        return false;
    }

    // 没有ts,显示获取token If there is no ts, the token will be obtained.
    if (!requestTime) {
        return false;
    } else {
        // 有ts,再判断距离当前时间是否小于五分钟 If there is ts, then determine whether the current time is less than five minutes.
        const nowTime = moment();
        const seconds = moment(nowTime).diff(moment(requestTime), 'seconds');
        if (seconds >= 300) {
            return false;
        } else {
            setCutDownTimer(seconds);
            return true;
        }
    }
});

/**
* 有一个nsPro在获取token倒计时或者已经获取token,按钮禁用
* There is an NS Pro that is counting down to obtain the token or has already obtained the token, and the button is disabled.
*/
const disabledBtn = computed(() => {
    if (props.type === 'iHost') return false;
    return deviceStore.hasTokenOrTs;
});
/** 
* 倒计时时间
* Countdown time
*/
const countdownTime = ref(300);

const timer = ref<any>(null);

/** 
* 按钮展示内容的控制
* Control of button display content
*/
const showWhichContent = computed(() => {
    if (!props.gateWayData.ipValid) {
        return i18n.global.t('IP_FAILED');
    }
    // 已获取token Token has been obtained
    if (props.gateWayData.tokenValid) {
        return i18n.global.t('ALREADY_GET_TOKEN');
    }
    // 获取token Get token
    return i18n.global.t('GET_TOKEN');
});

/** 
* 开始倒计时
* Start countdown
*/
const setCutDownTimer = (seconds: number) => {
    countdownTime.value = 300 - seconds;

    if (timer.value) {
        window.clearInterval(timer.value);
    }

    timer.value = window.setInterval(() => {
        if (countdownTime.value > 0) {
            countdownTime.value--;
        } else {
            window.clearInterval(timer.value);
            countdownTime.value = 0;
            refreshGateWayList();
        }
    }, 1000);
};

/**
* 获取token
* Get token
*/
const getToken = async (mac: string) => {
    if (props.type === 'nsPro') {
        openNsProTipModal();
    }
    const isSyncTarget = props.type === 'iHost' ? 1 : 0;
    const res = await api.getToken(mac, isSyncTarget);
    if (res.error === 0 && res.data) {
        refreshGateWayList();
    }
};

/** 
* 格式化时间
* Format time
*/
const formatCount = (count: number) => {
    const min = Math.floor(count / 60);
    const sec = count % 60;
    return `${min}min${sec}s`;
};

/** 
* 去掉ip端口号
* Remove ip port number
*/
const formatIp = computed(() => {
    if (!props.gateWayData.ip) return '';

    if (props.gateWayData.ip.indexOf(':') !== -1) {
        return props.gateWayData.ip.substring(0, props.gateWayData.ip.indexOf(':'));
    }

    return props.gateWayData.ip;
});

/** 
* 刷新网关数据
* Refresh gateway data
*/
const refreshGateWayList = () => {
    if (props.type === 'iHost') {
        deviceStore.getIHostGateWatList();
    } else {
        deviceStore.getNsProGateWayList();
    }
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
    :deep(.ant-btn-primary[disabled]) {
        background-color: #999999 !important;
        border: 1px solid rgba(153, 153, 153, 0.3) !important;
        font-weight: 500 !important;
        color: #ffffff !important;
        font-size: 16px !important;
    }
}
.card:hover {
    scale: 1.02;
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
}
.disabled:hover {
    scale: 1 !important;
    cursor: not-allowed !important;
}
</style>
