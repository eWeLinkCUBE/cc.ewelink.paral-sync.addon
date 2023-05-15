import process from 'node:process';
import {
    getGatewayInfo,
    getGatewayToken,
    getGatewayDeviceList,
    addGatewaySubDeviceList,
    updateGatewaySubDeviceOnline,
    ApiClient
} from '../api';

// 测试前准备
// 1. 创建 server/.env 文件
// 2. 添加环境变量 TEST_CUBE_HOST, TEST_CUBE_AT
// 3. 在 server 目录下，运行命令 npx ts-node -r dotenv/config test/cube-api.test.ts

const host = process.env.TEST_CUBE_HOST as string;
const at = process.env.TEST_CUBE_AT as string;
const subDevice = process.env.TEST_CUBE_SUBDEV as string;
const onlineParams = process.env.TEST_CUBE_DEV_ONLINE as string;

async function testGetGatewayInfo() {
    const res = await getGatewayInfo(host);
}

async function testGetGatewayToken() {
    const res = await getGatewayToken(host);
}

async function testGetGatewayDeviceList() {
    const client = new ApiClient({ ip: host, at });
    const res = await getGatewayDeviceList(client);
}

async function testAddGatewaySubDeviceList() {
    const client = new ApiClient({ ip: host, at });
    const dev = JSON.parse(subDevice);
    const res = await addGatewaySubDeviceList(client, [dev]);
}

async function testUpdateGatewaySubDeviceOnline() {
    const client = new ApiClient({ ip: host, at });
    const online = JSON.parse(onlineParams);
    const res = await updateGatewaySubDeviceOnline(client, online);
}

// testGetGatewayInfo();
// testGetGatewayToken();
// testGetGatewayDeviceList();
// testAddGatewaySubDeviceList();
testUpdateGatewaySubDeviceOnline();
