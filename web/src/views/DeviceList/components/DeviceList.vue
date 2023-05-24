<template>
    <div class="device">
        <div class="table-header">
            <div class="name">{{$t('DEVICE_NAME')}}</div>
            <div class="id">{{$t('DEVICE_ID')}}</div>
            <div class="option">{{$t('ACTION')}}</div>
        </div>
        <div class="table-body">
            <div class="device-list">
                <div class="device-item" v-for="(item, index) in deviceList" :key="index">
                    <span class="name">{{ item.name }}</span>
                    <span class="id">{{ item.id }}</span>
                    <div class="option">
                        <span class="sync" v-if="!item.isSynced" @click="syncDevice(item)">{{$t('SYNC')}}</span>
                        <span class="cancel-sync" v-else>{{$t('CANCEL')}}</span>
                    </div>
                </div>
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
import router from '@/router';
import api from '@/api';

const deviceList = computed(() => deviceStore.deviceList);
const deviceStore = useDeviceStore();

onMounted(async () => {
    console.log(1111);

    await deviceStore.getDeviceList();
});

const syncDevice = async (item: INsProDeviceData) => {
    const res = await api.NSPanelPro.syncSingleDevice(item.id, item.from);
    if (res.error === 0) {
        deviceStore.getDeviceList();
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
        .device-list {
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
                    min-width: 200px;
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
                }
            }
            .device-item:hover {
                background-color: #fafafa;
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
</style>
