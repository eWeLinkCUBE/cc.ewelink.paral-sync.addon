//内存中保存局域网扫描到的网关设备信息
interface IGatewayMap {
    ip: string;
    name: string; //'NSPanelPro.local'
    deviceId: string; //nsPro在ewelink中的设备id
}

class MDnsGatewayMapClass {
    public mDnsGatewayMap: Map<string, IGatewayMap>;
    constructor() {
        this.mDnsGatewayMap = new Map();
    }
}
export default new MDnsGatewayMapClass();
