<template>
    <div class="header">
        <div class="header-left">
            <div class="name">设备列表</div>
            <div class="description">设备将从 NSPanelPro 同步到iHost</div>
        </div>

        <div class="header-right">
            <div class="auto-sync">
                新增设备自动同步
                <a-switch v-model:checked="autoSync" />
            </div>
            <img class="all-sync" src="@/assets/img/sync-all-device.png" />
            <img class="setting" src="@/assets/img/setting.png" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const autoSync = ref(false);
</script>

<style scoped lang="scss">
.header {
    display: flex;
    padding: 16px;
    justify-content: space-between;
    .header-left {
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
    }
}
</style>
