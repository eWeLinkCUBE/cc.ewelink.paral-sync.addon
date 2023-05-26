<template>
    <div class="setting" v-if="startInIHost === 'normal'">
        <span class="title">{{ i18n.global.t('SETTING') }}</span>
        <!-- steps 1-->
        <div v-if="steps === stepsList.FIRST">
            <div class="step-info">
                <div class="first-step">
                    <div class="step-title">{{ i18n.global.t('STEP01_TOKEN') }}</div>
                    <div class="step-description">{{ i18n.global.t('GET_ACCESS_TOKEN') }}</div>
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
                <div class="first-step">
                    <div class="step-title">{{ i18n.global.t('STEP02_TOKEN') }}</div>
                    <div class="step-description">
                        {{ i18n.global.t('THE_FOLLOWING') }}
                        <img :class="isRefresh ? 'rotate' : ''" src="@/assets/img/refresh.png" @click="handleRefresh" />
                    </div>
                    <div class="step-description">{{ i18n.global.t('STEP2') }}</div>
                </div>
            </div>
            <div class="card-list">
                <GateWayCard v-for="(item, index) in deviceStore.nsProList" :key="index" :gateWayData="item" :type="'nsPro'" @openNsProTipModal="openNsProTipModal" />
                <!-- ip search -->
                <div class="card" :class="{ 'disabled-card': deviceStore.hasTokenOrTs }"  @click="openFindIpModal">
                    <img src="@/assets/img/search.png" />
                    <div class="ip-search">{{ i18n.global.t('IP_FIND') }}</div>
                </div>
            </div>
            <div class="next-step">
                <a @click="goDeviceListPage" :class="{ 'disabled-btn': !hasNsProToken }">{{ i18n.global.t('DONE') }} ></a>
            </div>
        </div>
    </div>
    <!-- 未在iHost启动 -->
    <div class="not-in-iHost" v-if="startInIHost === 'unusual'">
        <img src="@/assets/img/not-in-iHost.png" />
        <div>{{ i18n.global.t('PLEASE_START_IN_IHOST') }}</div>
    </div>

    <!-- findIp Modal -->
    <a-modal :visible="findIpVisible" destroyOnClose :maskClosable="false" centered :closable="false" width="504px" class="Modal">
        <template #title>
            <div style="text-align: center; margin-bottom: 18px">{{ i18n.global.t('IP_FIND') }}</div>
        </template>
        <div class="search-content">
            <a-input v-model:value="ipVal" style="width: 398px; height: 40px" @keyup.enter.native="linkNsProGateWay"/>
            <p v-if="ipFail">{{ i18n.global.t('CONNECT_IP_FAIL') }}</p>
        </div>
        <template #footer>
            <div style="text-align: center">
                <a-button class="default-btn common-btn" @click="findIpVisible = false" :disabled="findIpLoading">{{ i18n.global.t('CANCEL') }}</a-button>
                <a-button type="primary" class="common-btn" @click="linkNsProGateWay" :loading="findIpLoading">Link</a-button>
            </div>
        </template>
    </a-modal>

    <!-- nsPro 提示框 -->
    <a-modal :visible="nsProTipModalVisible" destroyOnClose :maskClosable="false" centered :closable="false" width="504px" class="NsPro-Modal">
        <template #title>
            <div class="nsPro-title">{{ i18n.global.t('GET_NSPRO_TOKEN') }}</div>
        </template>
        <div class="search-content" style="padding-bottom: 20px">
            <h3>{{ i18n.global.t('STEP2') }}</h3>
            <a-carousel autoplay>
                <div class="swiper-item" v-for="item,index in autoplayImageList" :key="index">
                    <img class="swiper-image" :src="item.imgSrc" />
                </div>
            </a-carousel>
        </div>
        <template #footer>
            <div style="text-align: center; margin: 10px 0">
                <a-button type="primary" class="common-btn" @click="nsProTipModalVisible = false">{{ i18n.global.t('GET_IT') }}</a-button>
            </div>
        </template>
    </a-modal>
</template>

<script setup lang="ts">
import { ref, onMounted, computed,watch } from 'vue';
import api from '@/api/NSPanelPro/index';
import type { IGateWayInfoData } from '@/api/ts/interface/IGateWay';
import { stepsList } from '@/api/ts/interface/IGateWay';
import { message } from 'ant-design-vue';
import { useDeviceStore } from '@/store/device';
import { useRouter } from 'vue-router';
import GateWayCard from './components/GateWayCard.vue';
import i18n from '@/i18n/index';
import _ from 'lodash';
const router = useRouter();
const deviceStore = useDeviceStore();
const steps = computed(() => deviceStore.step);

/** 查找ip弹窗 */
const findIpVisible = ref(false);
/** ip值 */
const ipVal = ref('');
/** 在iHost启动、空白、正常展示 */
const startInIHost = ref<'unusual' | 'normal' | 'empty'>('empty');
/** ip link fail */
const ipFail = ref(false);
/** nsPro 提示框 */
const nsProTipModalVisible = ref(false);
/** 刷新按钮状态 */
const isRefresh = ref(false);
/** 查找ip的loading */
const findIpLoading = ref(false);
/** 是否获取iHost的token */
const hasIHostToken = computed(() => deviceStore.iHostList.some((item) => item.tokenValid && item.ipValid));
/** 是否获取到一个nsPro的token */
const hasNsProToken = computed(() => deviceStore.nsProList.some((item) => item.tokenValid && item.ipValid));
/** 轮播图列表 */
const autoplayImageList:{imgSrc:string}[] = [
    {imgSrc:'/src/assets/img/setting-modal.png'},
    {imgSrc:'/src/assets/img/machine-modal.png'},
    {imgSrc:'/src/assets/img/click-modal.png'},
    {imgSrc:'/src/assets/img/token-modal.png'},
]

/** 判断获取iHost列表还是nsPro的列表 */
onMounted(async () => {
    if (steps.value === stepsList.FIRST) {
        const response = await deviceStore.getIHostGateWatList();
        startInIHost.value = 'normal';
        //不在iHost上启动
        if (response.error === 1101) {
            startInIHost.value = 'unusual';
        }
    } else {
        startInIHost.value = 'normal';
        await deviceStore.getNsProGateWayInfo();
    }
});

/**通过ip获取nsPanePro网关信息 */
const linkNsProGateWay = async () => {
    if (!ipVal.value || !ipVal.value.trim()) return;
    // if (deviceStore.nsProList.some((item) => item.ip === ipVal.value)) return;
    findIpLoading.value = true;
    const res = await api.linkNsProGateWay(ipVal.value);
    if (res.error === 0 && res.data) {
        //link成功后,后台会存下来
        deviceStore.getNsProGateWayInfo();
        findIpVisible.value = false;
        ipFail.value = false;
    } else {
        ipFail.value = true;
    }
    findIpLoading.value = false;
};

/** 刷新操作 */
const handleRefresh = () => {
    if (isRefresh.value) return;
    isRefresh.value = true;
    deviceStore.getNsProGateWayInfo();
    setTimeout(() => {
        isRefresh.value = false;
    }, 1000);
};

/** 没有iHost的token,回到第一步 */
watch(()=>hasIHostToken.value,()=>{
    if(!hasIHostToken.value){
        deviceStore.setStep(stepsList.FIRST);
    }
})

/** 点击下一步 */
const nextStep = () => {
    if (!hasIHostToken) return;
    deviceStore.setStep(stepsList.SECOND);
    deviceStore.getNsProGateWayInfo();
};

/** 点击完成 */
const goDeviceListPage = () => {
    if (!hasNsProToken) return;
    router.push('/deviceList');
    deviceStore.setStep(stepsList.FIRST);
};

/** 打开nsPro提示框 */
const openNsProTipModal = () => {
    nsProTipModalVisible.value = true;
};

/** 打开Link弹窗 */
const openFindIpModal = () => {
    findIpVisible.value = true;
    ipFail.value = false;
    ipVal.value = '';
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
            img {
                display: inline-block;
                width: 20px;
                height: 20px;
                cursor: pointer;
            }
        }
    }
    .card-list {
        display: flex;
        flex-wrap: wrap;
        gap: 24px;
        margin-top: 40px;
        padding: 0 80px;
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
        .disabled-card {
            pointer-events: none;
            filter: grayscale(100%);
            background: #e8e8ec;
            color: #9e9e9e;
        }

        .card:hover{
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

:deep(.ant-btn) {
    border-radius: 8px 8px 8px 8px;
    border: 1px solid rgba(153, 153, 153, 0.3);
    color: #fff;
}
:deep(.ant-carousel .slick-dots li button) {
    width: 8px;
    height: 8px;
    margin-right: 10px;
    background-color: #bbbbbb;
    border-radius: 50%;
}
:deep(.slick-dots-bottom) {
    bottom: -5px;
}
.default-btn {
    margin-right: 58px;
    color: #424242;
}
.common-btn {
    width: 120px;
    height: 40px;
}
.nsPro-title {
    text-align: center;
    margin-bottom: 18px;
    font-size: 20px;
    font-weight: 500;
    color: #424242;
}
.search-content {
    text-align: center;
    margin-top: 8px;
    margin-bottom: 4px;
    p {
        font-size: 12px;
        font-weight: 400;
        color: #ff5c5b;
        text-align: left;
        margin-left: 28px;
    }
    h3 {
        width: 440px;
        font-size: 16px;
        font-weight: 600;
        color: #424242;
        text-align: left;
    }
    .swiper-item {
        width: 365px;
        height: 174px;
        display: flex !important;
        justify-content: center;
        margin: 0 auto;
        align-items: flex-start;
        padding-top: 2px;
        font-size: 16px;
        width: calc(100% - 138px) !important;
        background: url(@/assets/img/background.png);
        img {
            height: 156px;
        }
    }
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
