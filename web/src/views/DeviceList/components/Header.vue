<template>
    <div class="header">
        <div class="header-left">
            <div class="name">{{ $t('DEVICE_LIST') }}</div>
            <div v-if="etcStore.isIPUnableToConnect" class="warning-tip">
                <warning-outlined />
                <span>
                    {{ $t('DEVICE_LIST') }}
                    <span style="color:red">{{ $t('GATEWAY_IP_INVALID') }}</span>
                </span>
            </div>
            <div class="description">{{ $t('SYNCED_FROM_NSPANEL') }}</div>
        </div>

        <div class="header-right" ref="headerRightRef">
            <div class="auto-sync">
                {{ $t('AUTO_SYNC_NEW') }}
                <a-switch style="margin-left: 10px" :disabled="isDisabled" @change="handleAutoSync" :checked="etcStore.autoSync" />
            </div>
            <a-popover trigger="hover" :getPopupContainer="() => headerRightRef">
                <template #content>
                    <span>{{ $t('ALL_DEVICES') }}</span>
                </template>
                <img @click="syncAllDevice" class="all-sync" :class="{ 'disabled-syncAllDevice': isDisabled }" src="@/assets/img/sync-all-device.png" />
            </a-popover>
            <img class="setting" @click="goSetting" src="@/assets/img/setting.png" />
        </div>
    </div>
</template>

<script setup lang="ts">
import api from '@/api';
import { ref } from 'vue';
import { WarningOutlined } from '@ant-design/icons-vue';
import router from '@/router';
import { useEtcStore } from '@/store/etc';
import { useDeviceStore } from '@/store/device';
import { message } from 'ant-design-vue';
import i18n from '@/i18n';
const headerRightRef = ref();
const etcStore = useEtcStore();
const deviceStore = useDeviceStore();
const handleAutoSync = async (e: boolean) => {
    const params = {
        autoSync: e,
    };
    const res = await api.NSPanelPro.autoSync(params);
    if (res.error === 0) {
        etcStore.setAutoSyncStatus(e);
    }
};

const syncAllDevice = async () => {
    if(isDisabled.value)return;
    etcStore.setIsLoading(true);
    const res = await api.NSPanelPro.syncAllDevice();
    if (res.error === 0 && res.data) {
        await deviceStore.getDeviceList();
        //根据同步所有设备接口返回的deviceId列表数据，去再次查询设备列表中同步成功的设备
        let count = 0;
        const syncDeviceIdList = res.data?.syncDeviceIdList;
        if(syncDeviceIdList.length>0 && deviceStore.deviceList.length>0){
            for(const item of syncDeviceIdList){
                for(const element of deviceStore.deviceList){
                    if(item === element.id && element.isSynced){
                        count++;
                        break;
                    }
                }
            }
        }
        if(count>0){
            message.success(i18n.global.t('DEVICE_SYNC_SUCCESS',{number:count}));
        }
    }
    etcStore.setIsLoading(false);
};

const goSetting = () => {
    router.push('/setting');
};
/** 没有设备禁用同步所有设备按钮 */
const isDisabled = computed(() => (deviceStore.deviceList.length < 1 ? true : false));
</script>

<style scoped lang="scss">
.header {
    display: flex;
    padding: 16px;
    justify-content: space-between;
    .header-left {
        width: 420px;
        position: relative;
        .warning-tip {
            position: absolute;
            left: 86px;
            top: 4px;
            color: #ff5c5b;
        }
        .name {
            font-size: 18px;
            font-weight: 600;
        }
        .description {
            color: #999999;
        }
    }
    .header-right {
        display: flex;
        align-items: center;
        .auto-sync {
            height: 40px;
            display: flex;
            justify-content: space-between;
            font-weight: 600;
            padding: 0 16px;
            align-items: center;
            border-radius: 8px 8px 8px 8px;
            border: 1px solid rgba(161, 161, 161, 0.1);
        }
        .all-sync {
            height: 27px;
            width: 27px;
            cursor: pointer;
            margin-left: 40px;
        }
        .disabled-syncAllDevice {
            pointer-events: none;
            -webkit-filter: grayscale(100%);
            -moz-filter: grayscale(100%);
            -ms-filter: grayscale(100%);
            -o-filter: grayscale(100%);
            filter: grayscale(100%);
            user-select: not-allowed;
        }
        .setting {
            height: 27px;
            width: 27px;
            cursor: pointer;
            margin-left: 28px;
        }
        &:deep(.ant-popover-inner) {
            border-radius: 4px;
        }
        &:deep(.ant-popover-inner-content) {
            padding: 8px 12px;
        }
    }
}
</style>
