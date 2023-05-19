<template>
    <div class="setting">
        <span class="title">Setting</span>
        <div class="step-info">
            <div class="step-title">step 01 获取本机Token</div>
            <div class="step-description">检测到 NSPanlePro 安装在 iHost 上，请点击获取本机的 token 以便将局域网内其他网关的设备同步到本机中</div>
        </div>
        <div class="card-list">
            <div class="card">
                <div class="name">iHost</div>
                <div class="ip">IP：192.168.1.11</div>
                <div class="mac">MAC：D0:27:03:20:A0:EA</div>
                <a-button>获取token</a-button>
            </div>
            <div class="card">
                <img src="@/assets/img/search.png" />
                <div class="ip-search">IP查找</div>
            </div>
        </div>
        <div class="next-step">
            <a>下一步 ></a>
        </div>
    </div>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss">
.setting {
    padding: 16px;
    .title {
        font-size: 16px;
        font-weight: 600;
    }
    .step-info {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        margin: 0 80px;
        .step-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 28px;
        }
        .step-description {
            font-size: 16px;
            color: rgba(66, 66, 66, 0.5);
        }
    }
    .card-list {
        display: flex;
        flex-wrap: wrap;
        gap: 24px;
        margin-top: 40px;
        padding: 0 80px;
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
            }
        }
    }
    .next-step {
        margin-top: 120px;
        text-align: right;
        padding: 0 64px;
        font-size: 16px;
        font-weight: 600;
    }
}

:deep(.ant-btn) {
    width: 194px;
    height: 40px;
    background: #1890ff;
    border-radius: 8px 8px 8px 8px;
    border: 1px solid rgba(153, 153, 153, 0.3);
    color: #fff;
}
</style>
