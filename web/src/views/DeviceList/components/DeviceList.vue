<template>
    <div class="device">
        <div class="table-header">
            <div class="name">{{ i18n.global.t('DEVICE_NAME') }}</div>
            <div class="id">{{ i18n.global.t('DEVICE_ID') }}</div>
            <div class="option">{{ i18n.global.t('ACTION') }}</div>
        </div>
        <div class="table-body">
            <div class="device-item" v-for="(item, index) in deviceList" :key="index" v-if="deviceList.length > 0">
                <span class="name common">{{ item.name }}</span>
                <span class="id common">{{ item.id }}</span>
                <div class="option common">
                    <span class="sync" v-if="!item.isSynced && !item.spinLoading" @click="syncDevice(item)">{{ i18n.global.t('SYNC') }}</span>
                    <span class="cancel-sync" v-if="item.isSynced && !item.spinLoading" @click="cancelSyncSingleDevice(item)">{{ i18n.global.t('CANCEL_SYNC') }}</span>
                    <img class="loading-icon" src="@/assets/img/loading.jpg" alt="" v-if="item.spinLoading" />
                </div>
            </div>
            <!-- length为0 -->
            <div v-else class="empty">
                <!-- loading状态 -->
                <div class="loading" v-if="loading">
                    <a-spin></a-spin>
                </div>
                <!-- 没登陆或者空状态 -->
                <div v-else>
                    <img :src="nsProLogin ? Empty : NoLogin" alt="" :class="nsProLogin ? 'no-data':'nsPro-no-login' "/>
                    <p v-if="nsProLogin">
                        {{ i18n.global.t('NO_DATA') }}
                    </p>
                    <div v-else class="nsPro_no_login">
                        <p  style="margin-top:16px">{{ i18n.global.t('GET_DEVICE_FAIL') }}</p>
                        <ul>
                            <li>{{ i18n.global.t('NS_PRO_RUN_NORMAL') }}</li>
                            <li>{{ i18n.global.t('NS_PRO_LOGIN') }}</li>
                        </ul>
                    </div>
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
import NoLogin from '@/assets/img/no-login.png';

const deviceList = computed(() => deviceStore.deviceList);
const deviceStore = useDeviceStore();
const loading = ref(false);
const nsProLogin = computed(() => deviceStore.nsProLogin);

onMounted(async () => {
    loading.value = true;
    await deviceStore.getNsProGateWayList();
    await deviceStore.getDeviceList();
    loading.value = false;
});

/**同步单个设备 */
const syncDevice = async (item: INsProDeviceData) => {
    deviceStore.setLoading(item, true);
    const res = await api.NSPanelPro.syncSingleDevice(item.id, item.from);
    await deviceStore.getDeviceList();
    if (res.error === 0) {
        message.success(i18n.global.t('SYNC_SUCCESS'));
    }
    deviceStore.setLoading(item, false);
};

/** 取消同步单个设备 */
const cancelSyncSingleDevice = async (item: INsProDeviceData) => {
    deviceStore.setLoading(item, true);
    const resp = await api.NSPanelPro.cancelSyncSingleDevice(item.id, item.from);
    await deviceStore.getDeviceList();
    if (resp.error === 0) {
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
            .nsPro-no-login{
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
</style>
