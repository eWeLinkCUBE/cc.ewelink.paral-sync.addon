<template>
    <div class="setting">
        <span class="title">{{$t('SETTING')}}</span>

        <!-- steps -->
        <div class="step-info">
            <div class="first-step" v-if="steps === stepsList.FIRST">
                <div class="step-title">{{$t('STEP01_TOKEN')}}</div>
                <div class="step-description">{{$t('GET_ACCESS_TOKEN')}}</div>
            </div>
            <div class="first-step" v-if="steps === stepsList.SECOND">
                <div class="step-title">{{$t('STEP02_TOKEN')}}</div>
                <div class="step-description">{{$t('THE_FOLLOWING')}}</div>
                <div class="step-description">{{$t('STEP2')}}</div>
            </div>
        </div>

        <!-- iHost or nsPanePro  -->
        <div class="card-list">
            <!-- iHost -->
            <GateWayCard v-for="item,index in deviceStore.iHostList" :key="index" v-if="steps === stepsList.FIRST" :gateWayData="item" :type="'iHost'"/>

            <!-- nsPro -->
            <GateWayCard v-for="item,index in deviceStore.nsProList" :key="index" v-if="steps === stepsList.SECOND" :gateWayData="item" :type="'nsPro'"/>

            <div class="card" v-if="steps === stepsList.SECOND">
                <img src="@/assets/img/search.png" />
                <div class="ip-search" @click="findIpVisible=true">IP查找</div>
            </div>
        </div>

        <!-- next step or finish -->
        <div class="next-step">
            <a @click="nextStep" v-if="steps === stepsList.FIRST">{{ $t('NEXT') }} ></a>
            <a v-else @click="goDeviceListPage">{{$t('DONE')}}</a>
        </div>
    </div>

    <!-- findIp Modal -->
    <a-modal :visible="findIpVisible" destroyOnClose :maskClosable="false" centered :closable="false" width="504px">
        <template #title>
            <div style="text-align: center">ip查找</div>
        </template>
        <div style="text-align: center">
            <a-form>
                <a-form-item>
                    <a-input v-model:value="ipVal" style="width: 398px; height: 40px" />
                </a-form-item>
            </a-form>
        </div>
        <template #footer>
            <div style="text-align: center">
                <a-button class="default-btn common-btn" @click="findIpVisible = false">Cancel</a-button>
                <a-button type="primary" class="common-btn" @click="linkNsProGateWay">Link</a-button>
            </div>
        </template>
    </a-modal>
</template>

<script setup lang="ts">
import { ref ,onMounted ,computed} from 'vue';
import api from '@/api/NSPanelPro/index';
import type { IGateWayInfoData} from '@/api/ts/interface/IGateWay';
import {stepsList} from '@/api/ts/interface/IGateWay';
import { message } from 'ant-design-vue';
import { useDeviceStore } from '@/store/device';
import { useRouter } from 'vue-router';
import GateWayCard from './components/GateWayCard.vue';


const router = useRouter();
const deviceStore = useDeviceStore();
const steps = computed(()=>deviceStore.step);

const findIpVisible = ref(false);
const ipVal = ref('192.168.31.214');

onMounted(()=>{
    if(steps.value === stepsList.FIRST){
        deviceStore.getIHostGateWatList();
    }else{
        //获取nsPro
        deviceStore.getNsProGateWayInfo();
    }
});

/**通过ip获取nsPanePro网关信息 */
const linkNsProGateWay = async () =>{
    if(!ipVal.value || !ipVal.value.trim())return;

    // if(nsProList.value.some((item)=>item.ip === ipVal.value))return;

    const res =await api.linkNsProGateWay(ipVal.value);
    if(res.error === 0 && res.data){
        //link成功后,后台会存下来
        deviceStore.getNsProGateWayInfo();
    }else{
        message.info(res.msg);
    }
    console.log('getGateWayInfo:',res);
}

/**下一步 */
const nextStep = () =>{
    if(steps.value === stepsList.FIRST){
        //获取iHost token
        if(!deviceStore.iHostList.some((item) => item.tokenValid)){
            return message.info('lack of IHost token');
        }
        deviceStore.setStep(stepsList.SECOND);
        deviceStore.getNsProGateWayInfo();
    }else{
        //获取nsPro token
        if(!deviceStore.nsProList.some((item) => item.tokenValid)){
            return message.info('lack of nsPro token');
        }
    }

}
/** 点击完成 */
const goDeviceListPage = () =>{
    router.push('/deviceList');
    deviceStore.setStep(stepsList.FIRST);
}
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
    }
    .next-step {
        margin-top: 120px;
        text-align: right;
        padding: 0 64px;
        font-size: 16px;
        font-weight: 600;
    }
    .common-btn {
        width: 120px;
        height: 40px;
    }
}

:deep(.ant-btn) {
    border-radius: 8px 8px 8px 8px;
    border: 1px solid rgba(153, 153, 153, 0.3);
    color: #fff;
}
:deep(.ant-modal .ant-modal-footer) {
    border-top: none !important;
}
:deep(.ant-modal .ant-modal-header) {
    border-bottom: none !important;
}

.default-btn {
    margin-right: 58px;
    color: #424242;
}
.common-btn{
    width: 120px;
    height:40px;
}
</style>
