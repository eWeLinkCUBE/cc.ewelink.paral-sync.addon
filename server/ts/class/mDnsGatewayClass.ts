//内存中保存局域网扫描到的网关设备信息
interface IGatewayMap {
    discoveryTime: number;
    gatewayInfo: {
        ip: string;
        name: string; //'NSPanelPro.local'
    };
}

class MDnsGatewayMapClass {
    public gatewayMap: Map<string, IGatewayMap>;
    constructor() {
        this.gatewayMap = new Map();
    }
}
export default new MDnsGatewayMapClass();
