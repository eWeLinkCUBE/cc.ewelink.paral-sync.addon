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
    getAutoSyncState()
    console.log(etcStore.language, '当前语言');
    const res = await api.NSPanelPro.getNsProGateWayInfo();
    if (res.error === 0 && res.data) {
        for (const i of res.data) {
            console.log(i, 'i');
        }
        // getDeviceList(res.data.mac);
    }

    // await getUserInfo();
    // getDeviceListInfo();
    // const getUserInfoInterval = setInterval(async () => getUserInfo(), 10000);
    // etcStore.setGetUserInfoInterval(getUserInfoInterval);
});

const getAutoSyncState = async () => {
    const res = await api.NSPanelPro.getAutoSyncState();
    if (res.error === 0 && res.data) {
        etcStore.setAutoSyncStatus(res.data.autoSync);
    }
};

const getDeviceList = async () => {
    const res = await api.NSPanelPro.getDeviceList();
    console.log(res, 'res');
    if (res.error === 0) {
        console.log('获取设备列表成功');
    }
    if (res.error === 1401) {
        router.push('/setting');
    }
};
</script>

<style scoped lang="scss"></style>
