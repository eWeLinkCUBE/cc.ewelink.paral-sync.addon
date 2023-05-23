<template>
    <div>
        <Header />
        <DeviceList />
    </div>
</template>

<script setup lang="ts">
import { useEtcStore } from '@/store/etc';
import { message } from 'ant-design-vue';
import Header from './components/Header.vue';
import DeviceList from './components/DeviceList.vue';
import i18n from '@/i18n';
import api from '@/api';
import { useDeviceStore } from '@/store/device';
import router from '@/router';
import type { INsProDeviceData} from '@/api/ts/interface/IGateWay';
const etcStore = useEtcStore();
const deviceStore = useDeviceStore();


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
    console.log(etcStore.language, '当前语言');
});


</script>

<style scoped lang="scss"></style>
