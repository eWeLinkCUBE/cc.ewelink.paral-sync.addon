<template>
    <!-- 正常显示 -->
    <div class="setting" v-if="startInIHost === 'NORMAL'">
        <span class="title">{{ i18n.global.t('SETTING') }}</span>
        <!-- steps 1-->
        <div v-if="steps === stepsList.FIRST">
            <div class="step-info">
                <div>
                    <p class="step-title">{{ i18n.global.t('STEP01_TOKEN') }}</p>
                    <div class="step-description">{{ i18n.global.t('GET_ACCESS_TOKEN') }}</div>
                    <div class="step-description" style="color: red" v-if="iHostIpOrTokenInvalid">
                        <img alt="" src="@/assets/img/notice.png" class="notice"/>
                        <span v-if="!deviceStore.effectIHostIp">{{ i18n.global.t('IHOST_IP_INVALID', { name: deviceStore.iHostList[0].name || '' }) }}</span>
                        <span v-if="!deviceStore.effectIHostToken">{{ i18n.global.t('TOKEN_INVALID', { name: deviceStore.iHostList[0].name || '' }) }}</span>
                    </div>
                </div>
            </div>
            <div class="card-list">
                <GateWayCard v-for="(item, index) in deviceStore.iHostList" :key="index" :gateWayData="item" :type="'iHost'" />
            </div>
            <div class="next-step">
                <a @click="nextStep" :class="{ 'disabled-btn': !hasIHostToken }">{{ i18n.global.t('NEXT') }} ></a>
            </div>
        </div>
        <!-- steps 2-->
        <div v-if="steps === stepsList.SECOND">
            <div class="step-info">
                <div>
                    <p class="step-title">{{ i18n.global.t('STEP02_TOKEN') }}</p>
                    <div class="step-description">
                        {{ i18n.global.t('THE_FOLLOWING') }}
                        <img :class="isRefresh ? 'rotate' : ''" src="@/assets/img/refresh.png" @click="handleRefresh" />
                    </div>
                    <div class="step-description">{{ i18n.global.t('STEP2') }}</div>
                    <div class="step-description" style="color: red" v-if="nsProExistIpInValid">
                        <img alt="" src="@/assets/img/notice.png" class="notice"/>
                        <span v-if="deviceStore.hasOneInvalidNsProIP">{{ i18n.global.t('NS_PRO_IP_CANT_ACCESS', { name: nsProIpInvalidNameStr }) }}</span>
                        <span v-if="deviceStore.hasOneInvalidNsProToken">{{ i18n.global.t('TOKEN_INVALID', { name: nsProTokenInvalidNameStr }) }}</span>
                    </div>
                </div>
            </div>
            <div class="card-list">
                <GateWayCard v-for="(item, index) in deviceStore.nsProList" :key="index" :gateWayData="item" :type="'nsPro'" @openNsProTipModal="openNsProTipModal" />
                <!-- ip search -->
                <div class="card" :class="{ 'disabled-card': deviceStore.hasTokenOrTs }" @click="findIpVisible = true">
                    <img src="@/assets/img/search.png" />
                    <div class="ip-search">{{ i18n.global.t('IP_FIND') }}</div>
                </div>
            </div>
            <div class="next-step" style="margin-top: 95px">
                <a @click="goDeviceListPage" :class="{ 'disabled-btn': !hasNsProToken }">{{ i18n.global.t('DONE') }} ></a>
            </div>
        </div>
    </div>
    <!-- 未在iHost启动 -->
    <div class="not-in-iHost" v-else-if="startInIHost === 'UNUSUAL'">
        <img src="@/assets/img/not-in-iHost.png" />
        <div>{{ i18n.global.t('PLEASE_START_IN_IHOST') }}</div>
    </div>
    <!-- 加载首页的loading -->
    <div class="loading" v-else>
        <a-spin class="spin"></a-spin>
    </div>

    <LinkIpModal :findIpVisible="findIpVisible" @closeLinkIpModal="closeLinkIpModal"/>

    <GetNsProTokenModal :nsProTipModalVisible="nsProTipModalVisible" @closeNsProTipModal="closeNsProTipModal"/>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { stepsList } from '@/api/ts/interface/IGateWay';
import { useDeviceStore } from '@/store/device';
import { useRouter } from 'vue-router';
import GateWayCard from './components/GateWayCard.vue';
import LinkIpModal from './components/LinkIpModal.vue';
import GetNsProTokenModal from './components/GetNsProTokenTip.vue';
import i18n from '@/i18n/index';
import _ from 'lodash';
const router = useRouter();
const deviceStore = useDeviceStore();
const steps = computed(() => deviceStore.step);

/** 查找ip弹窗 */
const findIpVisible = ref(false);
/** 关闭link弹窗 */
const closeLinkIpModal = () =>{
    findIpVisible.value = false;
}
/** nsPro 提示框 */
const nsProTipModalVisible = ref(false);
/** 打开nsPro提示框 */
const openNsProTipModal = () => {
    nsProTipModalVisible.value = true;
};
/** 关闭nsPro提示框 */
const closeNsProTipModal = () =>{
    nsProTipModalVisible.value = false;
}
/** 在iHost启动、正常展示 、loading*/
const startInIHost = ref<'UNUSUAL' | 'NORMAL' | 'LOADING'>('LOADING');
/** 刷新按钮状态 */
const isRefresh = ref(false);
/** 是否获取iHost的token */
const hasIHostToken = computed(() => deviceStore.effectIHostIp && deviceStore.effectIHostToken);
/** 是否获取到一个nsPro的ip有效token */
const hasNsProToken = computed(() => deviceStore.nsProList.some((item) => item.tokenValid && item.ipValid));
/** iHost的ip不能访问或者token失效 */
const iHostIpOrTokenInvalid = computed(() =>{
    //曾经获取过token，token才会有值
    const onceObtainedToken = deviceStore.iHostList.some((item)=>item.token);
    //ip无效 或者 onceObtainedToken+token无效
    return !deviceStore.effectIHostIp || (!deviceStore.effectIHostToken && onceObtainedToken);
});
/**nsPro中ip不能访问的网关*/
const nsProIpInvalidNameStr = ref('');
/** nsPro中token无效的网关 */
const nsProTokenInvalidNameStr = ref('');
/** nsPro是否存在不能访问或者token失效的网关 */
const nsProExistIpInValid = computed(() => deviceStore.hasOneInvalidNsProIP || deviceStore.hasOneInvalidNsProToken);

/** ip失效或者token失效的网关名 */
watch(
    () => [deviceStore.hasOneInvalidNsProIP, deviceStore.hasOneInvalidNsProToken],
    () => {
        nsProIpInvalidNameStr.value = '';
        nsProTokenInvalidNameStr.value = '';
        //存在一个ip失效的nsPro
        if (deviceStore.hasOneInvalidNsProIP) {
            deviceStore.nsProList.forEach((item) => {
                if (!item.ipValid) {
                    nsProIpInvalidNameStr.value = nsProIpInvalidNameStr.value + item.name + '、';
                }
            });
            if (nsProIpInvalidNameStr.value.lastIndexOf('、') !== -1) {
                nsProIpInvalidNameStr.value = nsProIpInvalidNameStr.value.substring(0, nsProIpInvalidNameStr.value.length - 1);
            }
        }
        //存在一个token失效的nsPro
        if (deviceStore.hasOneInvalidNsProToken) {
            deviceStore.nsProList.forEach((item) => {
                if (!item.tokenValid) {
                    nsProTokenInvalidNameStr.value = nsProTokenInvalidNameStr.value + item.name + '、';
                }
            });
            if(nsProTokenInvalidNameStr.value.lastIndexOf('、')!==-1){
                nsProTokenInvalidNameStr.value = nsProTokenInvalidNameStr.value.substring(0,nsProTokenInvalidNameStr.value.length-1);
            }
        }
    }
);

/** 判断获取iHost列表还是nsPro的列表 */
onMounted(async () => {
    if (steps.value === stepsList.FIRST) {
        const response = await deviceStore.getIHostGateWatList();
        //不在iHost上启动
        if (response.error === 1101) {
            startInIHost.value = 'UNUSUAL';
        }
        startInIHost.value = 'NORMAL';
    } else {
        startInIHost.value = 'NORMAL';
        await deviceStore.getNsProGateWayList();
    }
});

/** 刷新操作 */
const handleRefresh = () => {
    if (isRefresh.value) return;
    isRefresh.value = true;
    deviceStore.getNsProGateWayList();
    setTimeout(() => {
        isRefresh.value = false;
    }, 1000);
};

/** 点击下一步 */
const nextStep = () => {
    if (!hasIHostToken.value) return;
    deviceStore.setStep(stepsList.SECOND);
    deviceStore.getNsProGateWayList();
};

/** 点击完成 */
const goDeviceListPage = () => {
    if (!hasNsProToken.value) return;
    router.push('/deviceList');
    deviceStore.setStep(stepsList.FIRST);
};
</script>

<style scoped lang="scss">
.setting {
    padding: 16px;
    .title {
        font-size: 16px;
        font-weight: 600;
    }
    .step-info {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        margin: 0 80px;
        .step-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 28px;
            text-align: center;
        }
        .step-description {
            font-size: 16px;
            color: rgba(66, 66, 66, 0.5);
            margin-bottom: 4px;
            img {
                display: inline-block;
                width: 20px;
                height: 20px;
                cursor: pointer;
                margin-bottom: 2px;
            }
            .notice{
                width:18px;
                height: 16px;
                margin-right: 8px;
                margin-bottom: 2px;
            }
        }
    }
    .card-list {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 24px;
        margin-top: 40px;
        padding: 0 80px;
        .card {
            padding: 16px;
            width: 226px;
            height: 168px;
            box-shadow: 0px 0px 5px 0px rgba(136, 136, 136, 0.25);
            border-radius: 12px 12px 12px 12px;
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
        .disabled-card {
            filter: grayscale(100%);
            background: #e8e8ec;
            color: #9e9e9e;
            scale: 1 !important;
            pointer-events: none;
        }

        .card:hover {
            scale: 1.02;
            cursor: pointer;
            box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
        }
    }
    .next-step {
        margin-top: 120px;
        text-align: right;
        padding: 0 64px;
        font-size: 16px;
        font-weight: 600;
        .disabled-btn {
            pointer-events: none;
            -webkit-filter: grayscale(100%);
            -moz-filter: grayscale(100%);
            -ms-filter: grayscale(100%);
            -o-filter: grayscale(100%);
            filter: grayscale(100%);
            user-select: none;
        }
    }
    .common-btn {
        width: 120px;
        height: 40px;
    }
}

.not-in-iHost {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    img {
        width: 365px;
        height: 279px;
        margin-bottom: 20px;
    }
    div {
        font-size: 18px;
        font-weight: 500;
        color: rgba(66, 66, 66, 0.5);
    }
}

.loading {
    width: 100vw;
    height: 100vh;
    text-align: center;
    position: relative;
    .spin {
        max-height: 100vh;
        position: absolute;
        right: 50%;
        top: 50%;
    }
}

:deep(.ant-btn) {
    border-radius: 8px 8px 8px 8px;
    border: 1px solid rgba(153, 153, 153, 0.3);
    color: #fff;
}

.rotate {
    animation: rotate 1s linear infinite;
    -webkit-animation: rotate 1s linear infinite; /* Safari and Chrome */
}

@keyframes rotate {
    100% {
        transform: rotate(360deg);
    }
}
@-webkit-keyframes rotate {
    /* Safari and Chrome */
    100% {
        transform: rotate(360deg);
    }
}
</style>
