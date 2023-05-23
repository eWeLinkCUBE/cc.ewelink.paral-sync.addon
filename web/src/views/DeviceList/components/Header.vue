<template>
    <div class="header">
        <div class="header-left">
            <div class="name">设备列表</div>
            <div class="warning-tip"><warning-outlined /><span> 网关name IP无法连接，请到设置页面检查并更新</span></div>
            <div class="description">设备将从 NSPanelPro 同步到iHost</div>
        </div>

        <div class="header-right" ref="headerRightRef">
            <div class="auto-sync">
                新增设备自动同步
                <a-switch @change="handleAutoSync" :checked="etcStore.autoSync" />
            </div>
            <a-popover trigger="hover" :getPopupContainer="() => headerRightRef">
                <template #content>
                    <span>一键同步所有设备</span>
                </template>
                <img @click="syncAllDevice" class="all-sync" src="@/assets/img/sync-all-device.png" />
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
const headerRightRef = ref();
const etcStore = useEtcStore();
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
    etcStore.setIsLoading(true);
    await api.NSPanelPro.syncAllDevice();
    etcStore.setIsLoading(false);
};

const goSetting = () => {
    router.push('/setting');
};
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
            width: 200px;
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
