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

    getDeviceList();
    // await getUserInfo();
    // getDeviceListInfo();
    // const getUserInfoInterval = setInterval(async () => getUserInfo(), 10000);
    // etcStore.setGetUserInfoInterval(getUserInfoInterval);
});

const getDeviceList = async () => {
   const res = await api.NSPanelPro.getDeviceList()
   console.log(res,'res');
   if(res.error===0){
    console.log("获取设备列表成功");
    
   }
   if(res.error===1401){
    router.push('/setting')
   }
};



</script>

<style scoped lang="scss"></style>
