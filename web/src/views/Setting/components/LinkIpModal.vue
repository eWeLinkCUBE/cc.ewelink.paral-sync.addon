<template>
    <!-- linkIp Modal -->
    <a-modal :visible="findIpVisible" destroyOnClose :maskClosable="false" centered :closable="false" width="504px" class="Modal">
        <template #title>
            <div style="text-align: center; margin-bottom: 18px">{{ i18n.global.t('IP_FIND') }}</div>
        </template>
        <div class="search-content">
            <a-input v-model:value="ipVal" style="width: 398px; height: 40px" :readonly="findIpLoading" @keyup.enter.native="linkNsProGateWay" />
            <p v-if="ipFail">{{ i18n.global.t('CONNECT_IP_FAIL') }}</p>
        </div>
        <template #footer>
            <div style="text-align: center">
                <a-button class="default-btn common-btn" @click="closeLinkIpModal" :disabled="findIpLoading">{{ i18n.global.t('CANCEL') }}</a-button>
                <a-button type="primary" class="common-btn" @click="linkNsProGateWay" :loading="findIpLoading">Link</a-button>
            </div>
        </template>
    </a-modal>
</template>

<script setup lang="ts">
import api from '@/api/NSPanelPro/index';
import i18n from '@/i18n/index';
import { useDeviceStore } from '@/store/device';
import { checkIpValid } from '@/utils/tools';
import { message } from 'ant-design-vue';
const deviceStore = useDeviceStore();
const props = defineProps<{
    findIpVisible: boolean;
}>();
/** 关闭弹窗回调 */
const emits = defineEmits(['closeLinkIpModal']);
const closeLinkIpModal = () => emits('closeLinkIpModal');
/** 查找ip的loading */
const findIpLoading = ref(false);
/** ip值 */
const ipVal = ref('');
/** ip link 失败 */
const ipFail = ref(false);
/**通过ip获取nsPanePro网关信息 */
const linkNsProGateWay = async () => {
    if (!ipVal.value || !ipVal.value.trim()) {
        message.warning(i18n.global.t('PLEASE_INPUT_IP'));
        return;
    }
    if (!checkIpValid(ipVal.value)) {
        return message.warning(i18n.global.t('PLEASE_INPUT_RIGHT_IP'));
    }
    ipFail.value = false;
    findIpLoading.value = true;
    const res = await api.linkNsProGateWay(ipVal.value);
    if (res.error === 0 && res.data) {
        //link成功后,后台会存下来
        deviceStore.getNsProGateWayList();
        closeLinkIpModal();
        message.success('success');
    } else {
        ipFail.value = true;
    }
    findIpLoading.value = false;
};
</script>

<style scoped lang="scss">
.search-content {
    text-align: center;
    margin-top: 8px;
    margin-bottom: 4px;
    p {
        font-size: 12px;
        font-weight: 400;
        color: #ff5c5b;
        text-align: left;
        margin-left: 28px;
    }
}
:deep(.ant-btn) {
    border-radius: 8px 8px 8px 8px;
    border: 1px solid rgba(153, 153, 153, 0.3);
    color: #fff;
}
.default-btn {
    margin-right: 58px;
    color: #424242;
}
.common-btn {
    width: 120px;
    height: 40px;
}
</style>
