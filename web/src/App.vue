<template>
    <RouterView />
</template>

<script setup lang="ts">
import {onMounted} from 'vue';
import { useSseStore } from "@/store/sse";
import { useDeviceStore } from '@/store/device';
const deviceStore = useDeviceStore();

const sseStore = useSseStore();
onMounted(() => {
    sseStore.startSse();
    //判断有没有token，跳转对应的页面
});
</script>
