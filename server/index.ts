import fs from 'fs';
import path from 'path';
import express from 'express';
import logger from './log';
import info from './middleware/info';
import router from './routes';
import { internalError, notFound } from './middleware/error';
import config from './config';
import { initDb } from './utils/db';
import oauth from './middleware/oauth';
import { checkDestGateway } from './middleware/checkDestGateway';
import _ from 'lodash';
import sseUtils from './utils/sseUtils';
import mDns from './utils/initMDns';

const app = express();
const port = config.nodeApp.port;

// 配置持久化所需文件
const dataPath = path.join(__dirname, 'data');
const dbPath = path.join(__dirname, 'data', 'db.json');
const versionPath = path.join(__dirname, 'version');

config.nodeApp.dataPath = dataPath;
config.nodeApp.dbPath = dbPath;

if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath);
}

const isDbFileExist = fs.existsSync(dbPath);

// 获取当前版本号
config.nodeApp.version = fs.existsSync(versionPath) ? fs.readFileSync(versionPath).toString() : '0.0.1';

// 将body解析为json格式
app.use(express.json());

// 加载静态文件
app.use(express.static(path.join(__dirname, 'public')));

// 记录传入参数
app.use(info);

// 鉴权校验
app.use(oauth);

// 检查同步目标网关有效性
app.use(checkDestGateway);

// 路由处理
app.use('/api/v1', router);

// 错误处理
app.use(notFound);
app.use(internalError);

app.listen(port, '0.0.0.0', async () => {
    // 初始化数据库
    await initDb(dbPath, isDbFileExist);
    // 启用所有来源网关的SSE
    await sseUtils.checkForSse();
    //启动时，扫描一下局域网设备，防止网关ip变了没更新
    mDns.query({
        questions: [
            {
                name: '_ewelink._tcp.local',
                type: 'PTR',
            },
        ],
    });
    logger.info(`Server is running at http://localhost:${port}----env: ${config.nodeApp.env}----version: v${config.nodeApp.version}`);
});
