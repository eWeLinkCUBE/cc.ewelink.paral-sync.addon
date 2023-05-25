<template>
    <div>
        <a-spin :spinning="etcStore.isLoading" :indicator="indicator" tip="正在同步所有设备，请稍等" size="large">
            <Header />
            <DeviceList />
        </a-spin>
    </div>
</template>

<script setup lang="ts">
import { useEtcStore } from '@/store/etc';
import { message } from 'ant-design-vue';
import Header from './components/Header.vue';
import DeviceList from './components/DeviceList.vue';
import { LoadingOutlined } from '@ant-design/icons-vue';
import i18n from '@/i18n';
import api from '@/api';
import { useDeviceStore } from '@/store/device';
import router from '@/router';
import type { INsProDeviceData } from '@/api/ts/interface/IGateWay';
import { stepsList } from '@/api/ts/interface/IGateWay';
const etcStore = useEtcStore();
const deviceStore = useDeviceStore();
const indicator = h(LoadingOutlined, {
    style: {
        fontSize: '24px',
    },
    spin: true,
});
onMounted(async () => {
    // 语言跟随浏览器
    // const browserLanguage = navigator.language;

    let browserLanguage = window.location.search;

    if (!browserLanguage) {
        browserLanguage = navigator.language;
    }

    if (browserLanguage.includes('zh')) {
        // etcStore.languageChange('en-us');
        etcStore.languageChange('zh-cn');
    } else {
        etcStore.languageChange('en-us');
    }
    getAutoSyncState();
    console.log(etcStore.language, '当前语言');
    // whichPage();
});
/** 判断iHost的token和nsPro的token */
const whichPage = async ()=>{
    const resp = await deviceStore.getIHostGateWatList();
    if(resp.error ===0 && !resp.data?.tokenValid){
        router.push('/setting');
        deviceStore.setStep(stepsList.FIRST);
        return;
    }

    const response = await deviceStore.getNsProGateWayInfo();
    if(response.error ===0 && response.data && response.data.length>0){
        const hasOneNsProToken = response.data.some((item)=>item.tokenValid);
        if(!hasOneNsProToken){
            router.push('/setting');
            deviceStore.setStep(stepsList.SECOND);
            return;
        }
    }

    await deviceStore.getDeviceList();
}

const getAutoSyncState = async () => {
    const res = await api.NSPanelPro.getAutoSyncState();
    if (res.error === 0 && res.data) {
        etcStore.setAutoSyncStatus(res.data.autoSync);
    }
};
</script>

<style scoped lang="scss"></style>
