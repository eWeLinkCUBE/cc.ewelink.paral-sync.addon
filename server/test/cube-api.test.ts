import {
    getGatewayInfo,
    getGatewayToken
} from '../api';

async function testGetGatewayInfo() {
    const host = '192.168.31.114:8081';
    // const host = '192.168.31.211';
    await getGatewayInfo(host);
}

async function testGetGatewayToken() {
    const host = '192.168.31.114:8081';
    // const host = '192.168.31.211';
    await getGatewayToken(host);
}

// testGetGatewayInfo();
testGetGatewayToken();
