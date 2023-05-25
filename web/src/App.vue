<template>
    <RouterView />
</template>

<script setup lang="ts">
import {onMounted} from 'vue';
import { useSseStore } from "@/store/sse";
import { useDeviceStore } from '@/store/device';
import { useRouter } from 'vue-router';
import { stepsList } from '@/api/ts/interface/IGateWay';
const router = useRouter();
const deviceStore = useDeviceStore();

const sseStore = useSseStore();
onMounted(() => {
    sseStore.startSse();
    //判断有没有token，跳转对应的页面
    judgeToken();
});
const judgeToken = () =>{
    const hsaOneIHostToken = deviceStore.iHostList.some((item)=>item.tokenValid);
    if(deviceStore.iHostList.length < 1 || !hsaOneIHostToken){
        console.log('跳回第一步----------》');
        deviceStore.setStep(stepsList.FIRST);
        router.push('/setting');
        return;
    }

    const hsaOneNsProToken = deviceStore.nsProList.some((item)=>item.tokenValid);
    if(deviceStore.nsProList.length < 1 || !hsaOneNsProToken){
        console.log('跳回第二步---------》');
        deviceStore.setStep(stepsList.SECOND);
        router.push('/setting');
        return;
    }
}
</script>
