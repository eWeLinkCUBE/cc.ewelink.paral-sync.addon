<template>
    <!-- nsPro 提示框 -->
    <a-modal :visible="nsProTipModalVisible" destroyOnClose :maskClosable="false" centered :closable="false" width="504px" class="NsPro-Modal">
        <template #title>
            <div class="nsPro-title">{{ i18n.global.t('GET_NS_PRO_TOKEN') }}</div>
        </template>
        <div class="search-content" style="padding-bottom: 20px">
            <h3>{{ i18n.global.t('STEP2') }}</h3>
            <a-carousel autoplay>
                <div class="swiper-item" v-for="(item, index) in (language ? zh_autoplayImageList : en_autoplayImageList)" :key="index">
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
import { useEtcStore } from '@/store/etc';
import i18n from '@/i18n/index';
//中文图
import Setting_zh from '@/assets/img/setting-modal-zh.png';
import Machine_zh from '@/assets/img/machine-modal-zh.png';
import Click_zh from '@/assets/img/click-modal-zh.png';
import Token_zh from '@/assets/img/token-modal-zh.png';
//英文图
import Setting_en from '@/assets/img/setting-modal-en.png';
import Machine_en from '@/assets/img/machine-modal-en.png';
import Click_en from '@/assets/img/click-modal-en.png';
import Token_en from '@/assets/img/token-modal-en.png';
const props = defineProps<{
    nsProTipModalVisible: boolean;
}>();
const etcStore = useEtcStore();
/** 关闭弹窗回调 */
const emits = defineEmits(['closeNsProTipModal']);
const closeNsProTipModal = () => emits('closeNsProTipModal');
/** 当前语言环境 */
const language = computed(() => etcStore.language === 'zh-cn');
/** 英文轮播图列表 */
const en_autoplayImageList: { imgSrc: string }[] = [{ imgSrc: Setting_en }, { imgSrc: Machine_en }, { imgSrc: Click_en }, { imgSrc: Token_en }];
/** 中文轮播图列表 */
const zh_autoplayImageList: { imgSrc: string }[] = [{ imgSrc: Setting_zh }, { imgSrc: Machine_zh }, { imgSrc: Click_zh }, { imgSrc: Token_zh }];
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
