<template>
    <RouterView />
</template>

<script setup lang="ts">
import {onMounted} from 'vue';
import { useSseStore } from "@/store/sse";
import { useDeviceStore } from '@/store/device';
import { stepsList } from '@/api/ts/interface/IGateWay';
const deviceStore = useDeviceStore();

const sseStore = useSseStore();
onMounted(() => {
    sseStore.startSse();
    // 判断步骤
    judgeToken();
});

const judgeToken = () =>{
    if(deviceStore.iHostList.length>0 && deviceStore.iHostList.some((item)=> item.tokenValid)){
        deviceStore.setStep(stepsList.FIRST);
    }
    if(deviceStore.nsProList.length>0 && deviceStore.nsProList.some((item)=> item.tokenValid)){
        deviceStore.setStep(stepsList.SECOND);
    }
}

</script>
