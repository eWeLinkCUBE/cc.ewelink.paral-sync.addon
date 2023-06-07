<template>
    <div class="device">
        <div class="table-header">
            <div class="name">{{ i18n.global.t('DEVICE_NAME') }}</div>
            <div class="id">{{ i18n.global.t('DEVICE_ID') }}</div>
            <div class="option">{{ i18n.global.t('ACTION') }}</div>
        </div>
        <div class="table-body Scroll-bar">
            <div class="device-item" v-for="(item, index) in deviceList" :key="index" v-if="deviceList.length > 0">
                <span class="name common">{{ item.name }}</span>
                <span class="id common">{{ item.id }}</span>
                <div class="option common" style="padding-left:4px">
                    <div v-if="item.isSupported">
                        <span class="sync" v-if="!item.isSynced && !item.spinLoading" @click="syncDevice(item)">{{ i18n.global.t('SYNC') }}</span>
                        <span class="cancel-sync" v-if="item.isSynced && !item.spinLoading" @click="cancelSyncSingleDevice(item)">{{ i18n.global.t('CANCEL_SYNC') }}</span>
                        <img class="loading-icon" src="@/assets/img/loading.jpg" alt="" v-if="item.spinLoading" />
                    </div>
                    <div v-else>
                        <span style="color: ##a1a1a1">{{ i18n.global.t('NOT_SUPPORTED') }}</span>
                    </div>
                </div>
            </div>
            <div v-else class="empty">
                <div class="loading" v-if="loading">
                    <a-spin></a-spin>
                </div>
                <div v-else>
                    <img :src="Empty" alt="" class="no-data" />
                    <p>{{ i18n.global.t('NO_DATA') }}</p>
                </div>
            </div>
        </div>
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
import Empty from '@/assets/img/empty.png';

const deviceList = computed(() => deviceStore.deviceList);
const deviceStore = useDeviceStore();
const loading = ref(false);

onMounted(async () => {
    loading.value = true;
    await deviceStore.getDeviceList();
    loading.value = false;
});

/**同步单个设备 */
const syncDevice = async (item: INsProDeviceData) => {
    deviceStore.setLoading(item, true);
    const res = await api.NSPanelPro.syncSingleDevice(item.id, item.from);
    /** 方案一：查询设备列表接口 */
    // await deviceStore.getDeviceList();
    if (res.error === 0) {
        /** 方案二：改变本地缓存数据,未同步状态  */
        deviceStore.modifyDeviceSyncStatusById(item.id, true);
        message.success(i18n.global.t('SYNC_SUCCESS'));
    }
    deviceStore.setLoading(item, false);
};

/** 取消同步单个设备 */
const cancelSyncSingleDevice = async (item: INsProDeviceData) => {
    deviceStore.setLoading(item, true);
    const resp = await api.NSPanelPro.cancelSyncSingleDevice(item.id, item.from);
    /** 方案一：查询设备列表接口 */
    // await deviceStore.getDeviceList();
    if (resp.error === 0) {
        /** 方案二：改变本地缓存数据,同步状态 */
        deviceStore.modifyDeviceSyncStatusById(item.id, false);
        message.success(i18n.global.t('CANCEL_SYNC_SUCCESS'));
    }
    deviceStore.setLoading(item, false);
};
</script>

<style scoped lang="scss">
.device {
    height: calc(100vh - 95px);
    min-width: 800px;
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
            .common {
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
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
            .no-data {
                width: 365px;
                height: 279px;
            }
            .nsPro-no-login {
                width: 225px;
                height: 172px;
            }

            p {
                font-size: 20px;
                font-weight: 500;
                color: rgba(66, 66, 66, 0.5);
                margin-top: 44px;
            }
            .nsPro_no_login {
                width: 340px;
                margin-top: 16px;
                p {
                    margin-bottom: 8px;
                    font-size: 18px;
                    font-weight: 500;
                    color: #424242;
                }
                ul {
                    li {
                        text-align: left;
                        font-size: 16px;
                        font-weight: 500;
                        color: #424242;
                    }
                }
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

.Scroll-bar::-webkit-scrollbar {
    /*滚动条整体样式*/
    width: 8px;
    /*高宽分别对应横竖滚动条的尺寸*/
    height: 8px;
}


.Scroll-bar::-webkit-scrollbar-thumb {
    /*滚动条里面小方块*/
    border-radius: 5px;
    -webkit-box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.1);
    background: rgba(0, 0, 0, 0.1);
}


.Scroll-bar::-webkit-scrollbar-track {
    /*滚动条里面轨道*/
    -webkit-box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.1);
    border-radius: 0;
    background: rgba(0, 0, 0, 0.1);
}
</style>
