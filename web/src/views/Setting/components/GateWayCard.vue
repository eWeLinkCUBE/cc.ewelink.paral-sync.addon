<template>
    <div class="card">
        <div class="name">{{ gateWayData.name || 'Name' }}</div>
        <div class="ip">IP：{{ gateWayData.ip }}</div>
        <div class="mac">MAC：{{ gateWayData.mac }}</div>
        <a-button type="primary" style="width: 194px; height: 40px" @click="getToken(gateWayData.ip)">获取token</a-button>
    </div>
</template>

<script setup lang="ts">
import type { IGateWayInfoData} from '@/api/ts/interface/IGateWay';
import api from '@/api/NSPanelPro/index';
const props = defineProps<{
    gateWayData: IGateWayInfoData;
    type:'iHost'|'nsPro'
}>();

/**获取token */
const getToken = async (ip:string) =>{
    const res = await api.getToken(ip);
    console.log('---------------->',res);
}
</script>

<style scoped lang="scss">
.card {
    padding: 16px;
    width: 226px;
    height: 168px;
    box-shadow: 0px 0px 5px 0px rgba(136, 136, 136, 0.25);
    border-radius: 12px 12px 12px 12px;
    .name {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 11px;
    }
    .ip {
        margin-bottom: 6px;
        color: #a1a1a1;
    }
    .mac {
        margin-bottom: 10px;
        color: #a1a1a1;
    }
    img {
        margin: 20px 64px;
    }
    .ip-search {
        text-align: center;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
    }
}
</style>
