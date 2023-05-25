<template>
    <div class="device">
        <div class="table-header">
            <div class="name">{{ i18n.global.t('DEVICE_NAME') }}</div>
            <div class="id">{{ i18n.global.t('DEVICE_ID') }}</div>
            <div class="option">{{ i18n.global.t('ACTION') }}</div>
        </div>
        <div class="table-body">
            <div class="device-item" v-for="(item, index) in deviceList" :key="index" v-if="deviceList.length > 0">
                <span class="name">{{ item.name }}</span>
                <span class="id">{{ item.id }}</span>
                <div class="option">
                    <span class="sync" v-if="!item.isSynced && !item.spinLoading" @click="syncDevice(item)">{{ i18n.global.t('SYNC') }}</span>
                    <span class="cancel-sync" v-if="item.isSynced && !item.spinLoading" @click="cancelSyncSingleDevice(item)">{{ i18n.global.t('CANCEL_SYNC') }}</span>
                    <img class="loading-icon" src="@/assets/img/loading.jpg"  alt="" v-if="item.spinLoading"/>
                </div>
            </div>
            <div v-else class="empty">
                <img src="@/assets/img/empty.png" />
                <div>{{ i18n.global.t('NO_DATA') }}</div>
            </div>
        </div>
        <!-- <div class="pagination">
            <a-pagination v-model:current="current" :total="50" show-less-items />
        </div> -->
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import type { INsProDeviceData } from '@/api/ts/interface/IGateWay';
import { useDeviceStore } from '@/store/device';
import { message } from 'ant-design-vue';
import i18n from '@/i18n/index';
import router from '@/router';
import api from '@/api';
import { getAssetsFile } from '@/utils/tools';

const deviceList = computed(() => deviceStore.deviceList);
const deviceStore = useDeviceStore();

onMounted(async () => {
    await deviceStore.getDeviceList();
});

/**同步单个设备 */
const syncDevice = async (item: INsProDeviceData) => {
    deviceStore.setLoading(item,true);
    const res = await api.NSPanelPro.syncSingleDevice(item.id, item.from);
    if (res.error === 0) {
        message.success('success');
        //方案一：接口查询
        await deviceStore.getDeviceList();
        //方案二：修改本地状态
        // deviceStore.modifyNsProListById(item.id,true);
        //loading取消
        deviceStore.setLoading(item,false);
    }

};
/** 取消同步单个设备 */
const cancelSyncSingleDevice = async (item: INsProDeviceData) => {
    deviceStore.setLoading(item,true);
    const resp = await api.NSPanelPro.cancelSyncSingleDevice(item.id, item.from);
    if (resp.error === 0) {
        message.success('success');
        //方案一：接口查询
        await deviceStore.getDeviceList();
        //方案二：修改本地状态
        // deviceStore.modifyNsProListById(item.id,true);
        //loading取消
        deviceStore.setLoading(item,false);
    }
};
</script>

<style scoped lang="scss">
.device {
    height: calc(100vh - 95px);
    .table-header {
        display: flex;
        align-items: center;
        padding: 0 60px;
        height: 50px;
        background: rgba(24, 144, 255, 0.05);
        font-size: 18px;
        font-weight: 600;
        .name,
        .id {
            width: 40%;
            min-width: 200px;
        }
        .option {
            width: 20%;
        }
    }
    .table-body {
        height: calc(100% - 50px);
        overflow: auto;
        position: relative;
        .device-item {
            display: flex;
            align-items: center;
            padding: 0 60px;
            opacity: 1;
            height: 45px;
            line-height: 45px;
            border-bottom: 1px solid #f0f0f0;
            .name,
            .id {
                width: 40%;
                font-size: 14px;
                font-weight: 500;
                color: #424242;
            }
            .option {
                width: 20%;
                .sync {
                    font-size: 14px;
                    font-weight: 500;
                    color: #1890ff;
                    cursor: pointer;
                }
                .cancel-sync {
                    font-size: 14px;
                    font-weight: 500;
                    color: #ff5c5b;
                    cursor: pointer;
                }

                .loading-icon {
                    width: 16px;
                    height: 16px;
                    animation: rotate 2s linear infinite;
                }
            }
        }
        .device-item:hover {
            background-color: #fafafa;
        }

        .empty {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            img {
                width: 365px;
                height: 279px;
                margin-bottom: 44px;
            }
            div {
                font-size: 20px;
                font-weight: 500;
                color: rgba(66, 66, 66, 0.5);
            }
        }
    }
    .pagination {
        text-align: right;
        position: absolute;
        right: 20px;
        bottom: 20px;
    }
}

@keyframes rotate {
    100% {
        transform: rotate(360deg);
    }
}
</style>
