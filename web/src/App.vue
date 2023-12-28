<template>
    <RouterView />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useSseStore } from '@/store/sse';
import { useDeviceStore } from '@/store/device';
import { useRouter } from 'vue-router';
import { stepsList } from '@/api/ts/interface/IGateWay';
import { useEtcStore } from '@/store/etc';
const etcStore = useEtcStore();
const router = useRouter();
const deviceStore = useDeviceStore();

const sseStore = useSseStore();
onMounted(() => {
    // 初始化语言 initialization language
    judgeLangue();
    // 连接sse connect sse
    sseStore.startSse();
    // 正常情况维持状态 Maintain status under normal circumstances
    keepPageInRefresh();
    // 缓存+接口判断是不是第一次进入 Cache + interface to determine whether it is the first time to enter
    judgeIsFirstEnter();
});
/** 
* 判断当前语言
* Determine the current language
*/
const judgeLangue = () =>{
    let browserLanguage = window.location.search;
    if (!browserLanguage) {
        browserLanguage = navigator.language;
    }
    if (browserLanguage.includes('zh')) {
        etcStore.languageChange('zh-cn');
    } else {
        etcStore.languageChange('en-us');
    }
    // console.log(etcStore.language, '当前语言');
}

/** 
* 在全流程正常的情况下刷新页面要求停留在当前页面,此处调用先于接口
* When the whole process is normal, refreshing the page requires staying on the current page. The interface is called here before
*/
const keepPageInRefresh = () => {
    if ([stepsList.FIRST, stepsList.SECOND].includes(deviceStore.step)) {
        // console.log('keep page 1 when refresh');
        router.push('/setting');
    }
    if (stepsList.THIRD === deviceStore.step) {
        // console.log('keep page 2 when refresh');
        router.push('/deviceList');
    }
};

/** 
* 判断是否是第一次进入，第一次进入需要跳到第一步，其他的时候在列表上红字提示
* Determine whether it is the first time to enter. If you enter for the first time, you need to jump to the first step. 
* Otherwise, there will be a red text prompt on the list.
*/
const judgeIsFirstEnter = async () => {
    // 缓存无数据直接跳转第一步 If there is no data in the cache, jump directly to the first step.
    if (!deviceStore.iHostList || deviceStore.iHostList.length < 1) {
        deviceStore.setStep(stepsList.FIRST);
        router.push('/setting');
        // console.log('app.vue jump iHost');
        return;
    } else {
        // 缓存有数据，重新拉取一遍列表，判断IP和token There is data in the cache. Pull the list again to determine the IP and token.
        await deviceStore.getIHostGateWatList();
        const hasIHostToken = deviceStore.iHostList.some((item) => item.tokenValid && item.ipValid);
        if (!hasIHostToken) {
            deviceStore.setStep(stepsList.FIRST);
            router.push('/setting');
            // console.log('app.vue interface jump iHost');
            return;
        }
    }
    // 判断缓存内的数据 Determine the data in the cache
    const hasEffectIHost = deviceStore.iHostList.some((item) => item.ipValid && item.tokenValid);
    if (hasEffectIHost) {
        // 缓存无数据，直接跳转第二步 There is no data in the cache, jump directly to the second step.
        if (!deviceStore.nsProList || deviceStore.nsProList.length < 1) {
            deviceStore.setStep(stepsList.SECOND);
            router.push('/setting');
            // console.log('app.vue jump nsPro');
        } else {
            // 缓存有数据，重新拉取一遍列表，判断IP和token There is data in the cache. Pull the list again to determine the IP and token.
            await deviceStore.getNsProGateWayList();
            const hasNsProToken = deviceStore.nsProList.some((item) => item.tokenValid && item.ipValid);
            if (!hasNsProToken) {
                deviceStore.setStep(stepsList.SECOND);
                router.push('/setting');
                // console.log('app.vue interface jump nsPro');
            }
        }
    }
};
</script>
