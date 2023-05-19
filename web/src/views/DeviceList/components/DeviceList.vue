<template>
    <div>
        <div class="table-header">
            <div class="name">文件名称</div>
            <div  class="id">设备ID</div>
            <div class="option">操作</div>
        </div>
        <div class="table-body">
            
        </div>
    </div>
</template>

<script setup lang="ts">
import api from '@/api';
</script>

<style scoped lang="scss">
.table-header {
    display: flex;
    align-items: center;
    padding: 0 60px;
    height: 50px;
    background: rgba(24, 144, 255, 0.05);
    font-size: 18px;
    font-weight: 600;
    .name,.id{
        width: 35%;
    }
    .option {
        width: 30%;
    }
}
</style>
