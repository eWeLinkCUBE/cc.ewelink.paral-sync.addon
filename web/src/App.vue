<template>
    <RouterView />
</template>

<script setup lang="ts">
import {onMounted} from 'vue';
import { useSseStore } from "@/store/sse";

const sseStore = useSseStore();
onMounted(() => {
    sseStore.startSse();
})
</script>
