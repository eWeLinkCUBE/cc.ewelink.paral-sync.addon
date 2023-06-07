<template>
    <div>
        <a-spin
            style="min-height:100vh;background-color:rgba(34,34,34,0.6);color:#FFFF;"
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
const etcStore = useEtcStore();
const deviceStore = useDeviceStore();
const indicator = h(LoadingOutlined, {
    style: {
        fontSize: '24px',
    },
    spin: true,
});
onMounted(async () => {
    getAutoSyncState();
});
/** 设置自动同步按钮状态 */
const getAutoSyncState = async () => {
    const res = await api.NSPanelPro.getAutoSyncState();
    if (res.error === 0 && res.data) {
        etcStore.setAutoSyncStatus(res.data.autoSync);
    }
};
</script>

<style scoped lang="scss">
</style>
