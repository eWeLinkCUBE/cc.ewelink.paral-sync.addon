<template>
    <div>
        <a-spin
            style="min-height:100vh"
            :spinning="etcStore.isLoading"
            :indicator="indicator"
            :tip="i18n.global.t('SYNC_ALL_DEVICE_WAIT')"
            size="large"
        >
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
        etcStore.languageChange('zh-cn');
    } else {
        etcStore.languageChange('en-us');
    }
    getAutoSyncState();
    console.log(etcStore.language, '当前语言');
});
/** 设置自动同步按钮状态 */
const getAutoSyncState = async () => {
    const res = await api.NSPanelPro.getAutoSyncState();
    if (res.error === 0 && res.data) {
        etcStore.setAutoSyncStatus(res.data.autoSync);
    }
};
</script>

<style scoped lang="scss"></style>
