<template>
     <!-- nsPro 提示框 -->
    <a-modal :visible="nsProTipModalVisible" destroyOnClose :maskClosable="false" centered :closable="false" width="504px" class="NsPro-Modal">
        <template #title>
            <div class="nsPro-title">{{ i18n.global.t('GET_NS_PRO_TOKEN') }}</div>
        </template>
        <div class="search-content" style="padding-bottom: 20px">
            <h3>{{ i18n.global.t('STEP2') }}</h3>
            <a-carousel autoplay>
                <div class="swiper-item" v-for="(item, index) in autoplayImageList" :key="index">
                    <img class="swiper-image" :src="item.imgSrc" />
                </div>
            </a-carousel>
        </div>
        <template #footer>
            <div style="text-align: center; margin: 10px 0">
                <a-button type="primary" class="common-btn" @click="closeNsProTipModal">{{ i18n.global.t('GET_IT') }}</a-button>
            </div>
        </template>
    </a-modal>
</template>

<script setup lang="ts">
import i18n from '@/i18n/index';
import Setting from '@/assets/img/setting-modal.png';
import Machine from '@/assets/img/machine-modal.png';
import Click from '@/assets/img/click-modal.png';
import Token from '@/assets/img/token-modal.png';
const props = defineProps<{
    nsProTipModalVisible: boolean;
}>();
/** 关闭弹窗回调 */
const emits = defineEmits(['closeNsProTipModal']);
const closeNsProTipModal = () => emits('closeNsProTipModal');
/** 轮播图列表 */
const autoplayImageList: { imgSrc: string }[] = [{ imgSrc: Setting }, { imgSrc: Machine }, { imgSrc: Click }, { imgSrc: Token }];
</script>

<style scoped lang="scss">
.search-content {
    text-align: center;
    margin-top: 8px;
    margin-bottom: 4px;
    h3 {
        width: 440px;
        font-size: 16px;
        font-weight: 600;
        color: #424242;
        text-align: left;
    }
    .swiper-item {
        width: 365px;
        height: 174px;
        display: flex !important;
        justify-content: center;
        margin: 0 auto;
        align-items: flex-start;
        padding-top: 2px;
        font-size: 16px;
        width: calc(100% - 138px) !important;
        background: url(@/assets/img/background.png);
        img {
            height: 156px;
        }
    }
}
:deep(.ant-carousel .slick-dots li button) {
    width: 8px;
    height: 8px;
    margin-right: 10px;
    background-color: #bbbbbb;
    border-radius: 50%;
}

:deep(.slick-dots-bottom) {
    bottom: -5px;
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
.nsPro-title {
    text-align: center;
    margin-bottom: 18px;
    font-size: 20px;
    font-weight: 500;
    color: #424242;
}
</style>
