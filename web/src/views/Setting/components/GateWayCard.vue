<template>
    <div class="card">
        <div class="name">{{ gateWayData.name || 'Name' }}</div>
        <div class="ip">IP：{{ gateWayData.ip }}</div>
        <div class="mac">MAC：{{ gateWayData.mac }}</div>
        <a-button
            type="primary"
            style="width: 194px; height: 40px"
            @click="getToken(gateWayData.mac)"
            :disabled="gateWayData.token ? true : false"
            :style="{ color: gateWayData.token ? '#ccc' : 'FFFF' }"
            >{{ showWhichContent(gateWayData) }}</a-button
        >
        <!-- {{gateWayData.tokenValid?'已获取token':'获取token'}} -->
        <!-- {{showWhichContent(gateWayData)}}  -->
    </div>
</template>

<script setup lang="ts">
import type { IGateWayInfoData } from '@/api/ts/interface/IGateWay';
import api from '@/api/NSPanelPro/index';
import i18n from '@/i18n/index';
import moment from 'moment';

const props = defineProps<{
    gateWayData: IGateWayInfoData;
    type: 'iHost' | 'nsPro';
}>();
/** 点击获取token时接口有返回的本地时间 */
const localTime = ref(0);
/** 倒计时时间 */
const countdownTime = ref(-1);

/** 按钮展示内容的控制 */
const showWhichContent = (gateWayData: IGateWayInfoData) => {
    console.log('gateWayData===========================', gateWayData);
    if (true) {
        // const timeGap = (localTime.value - (gateWayData.ts as number)) / 1000;
        // console.log('timeGap', timeGap);
        setCutDownTimer(gateWayData.ts as number);
        // return countdownTime;
    }

    //已获取token
    if (gateWayData.token && gateWayData.tokenValid) {
        return i18n.global.t('ALREADY_GET_TOKEN');
    }
    //倒计时
    if (!gateWayData.token && gateWayData.ts) {
        return countdownTime;
    }
    //获取token
    return i18n.global.t('GET_TOKEN');
};

const timer = ref<any>(null);

/** 开始倒计时 */
const setCutDownTimer = (timeGap: number) => {
    const nowTime = moment();

    const seconds = moment(nowTime).diff(moment(), 'seconds');

    if (seconds > 180) return;
    countdownTime.value = 180 - seconds;

    if (timer.value) {
        window.clearInterval(timer.value);
    }

    countdownTime.value--;

    timer.value = window.setInterval(() => {
        if (countdownTime.value > 0) {
            countdownTime.value--;
        } else {
            window.clearInterval(timer.value);
            countdownTime.value =timeGap;
        }
    }, 1000);
};

/**获取token */
const getToken = async (mac: string) => {
    const isSyncTarget = props.type === 'iHost' ? 1 : 0;
    const res = await api.getToken(mac, isSyncTarget);
    if (res.error === 0) {
        localTime.value = Date.now();
    }
    console.log('getToken res---------------->', res);
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
    .ip-search {
        text-align: center;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
    }
}
</style>
