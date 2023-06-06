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
    keepPageInRefresh();
});
const keepPageInRefresh = () =>{
    // 在全流程正常的情况下刷新页面要求停留在当前页面,此处调用先于接口
    if([stepsList.FIRST,stepsList.SECOND].includes(deviceStore.step)){
        console.log('keep page 1 when refresh');
        router.push('/setting');
    }
    if(stepsList.THIRD === deviceStore.step){
        console.log('keep page 2 when refresh')
        router.push('/deviceList');
    }
}
</script>
