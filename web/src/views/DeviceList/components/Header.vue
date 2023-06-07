<template>
    <div class="header">
        <div class="header-left">
            <div class="left-top">
                <div class="name">{{ $t('DEVICE_LIST') }}</div>
                <div v-if="!deviceStore.ipToken" class="warning-tip">
                    <warning-outlined />
                    <span class="warning">{{ deviceStore.ipTokenMsg }}</span>
                </div>
            </div>
            <div class="description">{{ $t('SYNCED_FROM_NSPANEL') }}</div>
        </div>

        <div class="header-right" ref="headerRightRef">
            <div class="auto-sync">
                {{ $t('AUTO_SYNC_NEW') }}
                <a-switch style="margin-left: 10px" @change="handleAutoSync" :checked="etcStore.autoSync" />
            </div>
            <div class="force-refresh" @click="handleRefresh" :class="isRefresh ? 'rotate' : ''">
                <img src="@/assets/img/force-refresh.png" alt="" />
            </div>
            <a-popover trigger="hover" :getPopupContainer="() => headerRightRef">
                <template #content>
                    <span>{{ $t('ALL_DEVICES') }}</span>
                </template>
                <img @click="syncAllDevice" class="all-sync" :class="{ 'disabled-syncAllDevice': isDisabled }" :src="isDisabled ? SyncAllDeviceDisabled : SyncAllDevice" />
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
import SyncAllDeviceDisabled from '@/assets/img/sync-device-disabled.png';
import SyncAllDevice from '@/assets/img/sync-all-device.png';
import { sleep } from '@/utils/tools';
import { stepsList } from '@/api/ts/interface/IGateWay';
const headerRightRef = ref();
const etcStore = useEtcStore();
const deviceStore = useDeviceStore();
const retryTime = ref(0);
const MAX_RETRY_TIME = 15;
const isRefresh = ref(false);

/** 刷新操作 */
const handleRefresh = () => {
    if (isRefresh.value) return;
    isRefresh.value = true;
    deviceStore.getDeviceList('1');
    setTimeout(() => {
        isRefresh.value = false;
    }, 1000);
};

/** 自动同步所有设备按钮 */
const handleAutoSync = async (e: boolean) => {
    const params = {
        autoSync: e,
    };
    const res = await api.NSPanelPro.autoSync(params);
    if (res.error === 0) {
        etcStore.setAutoSyncStatus(e);
    }
};

/** 同步所有设备 */
const syncAllDevice = async () => {
    if (isDisabled.value) return;
    etcStore.setIsLoading(true);
    const res = await api.NSPanelPro.syncAllDevice();
    if (res.error === 0 && res.data) {
        await deviceStore.getDeviceList();
        //根据同步所有设备接口返回的deviceId列表数据，去再次查询设备列表中同步成功的设备
        const syncDeviceIdList = res.data?.syncDeviceIdList;
        await deviceSyncSuccessNum(syncDeviceIdList);
    } else {
        message.error(i18n.global.t('SYNC_FAIL'));
    }
    etcStore.setIsLoading(false);
};

/** 返回设置页面 */
const goSetting = () => {
    const step = deviceStore.ipTokenStep === stepsList.THIRD ? stepsList.FIRST : deviceStore.ipTokenStep;
    deviceStore.setStep(step);
    router.push('/setting');
};

/** 没有设备禁用同步所有设备按钮 */
const isDisabled = computed(() => (deviceStore.deviceList.length < 1 ? true : false));

/** 判断有多少设备提示成功，并且提示用户 */
const deviceSyncSuccessNum = async (syncDeviceIdList: string[]) => {
    if (!syncDeviceIdList || syncDeviceIdList.length < 1) {
        console.log('sync success device number is empty');
        return;
    }
    if (!deviceStore.deviceList || deviceStore.deviceList.length < 1) {
        console.log('nsPro deviceList number is empty');
        return;
    }
    let count = 0;
    for (const item of syncDeviceIdList) {
        for (const element of deviceStore.deviceList) {
            if (item === element.id && element.isSynced) {
                count++;
                break;
            }
        }
    }
    //当同步设备全部是同步成功状态，结束loading并且提示成功;
    if (count === syncDeviceIdList.length) {
        message.success(i18n.global.t('DEVICE_SYNC_SUCCESS', { number: count }));
        return;
    } else {
        retryTime.value++;
        if (retryTime.value <= MAX_RETRY_TIME) {
            await deviceStore.getDeviceList();
            await sleep(2000); //15*2=30(s)
            await deviceSyncSuccessNum(syncDeviceIdList);
        } else {
            // 三十秒还没成功,提示成功;
            message.success(i18n.global.t('DEVICE_SYNC_SUCCESS', { number: syncDeviceIdList.length }));
            return;
        }
    }
};
</script>

<style scoped lang="scss">
.header {
    display: flex;
    padding: 16px;
    justify-content: space-between;
    min-width: 1000px;
    .header-left {
        min-width: 420px;
        .left-top {
            display: flex;
            align-items: center;
            .warning-tip {
                color: #ff5c5b;
                display: flex;
                align-items: center;
                .warning {
                    // width: 400px;
                    white-space: normal;
                    word-break: break-all;
                    line-height: 15px;
                    margin-left: 5px;
                }
            }
            .name {
                font-size: 18px;
                font-weight: 600;
                min-width:90px;
            }
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
            margin-right: 27px;
        }
        .force-refresh {
            img {
                height: 27px;
                width: 27px;
            }
            cursor: pointer;
        }
        .all-sync {
            height: 27px;
            width: 27px;
            cursor: pointer;
            margin-left: 28px;
        }
        .disabled-syncAllDevice {
            user-select: none;
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
.rotate {
    animation: rotate 1s linear infinite;
    -webkit-animation: rotate 1s linear infinite; /* Safari and Chrome */
}

@keyframes rotate {
    100% {
        transform: rotate(360deg);
    }
}
@-webkit-keyframes rotate {
    /* Safari and Chrome */
    100% {
        transform: rotate(360deg);
    }
}

@media screen and (min-width: 1000px) {
    .warning {
        // width: 730px !important;
        line-height: 1.5715 !important;
    }
}
</style>
