import EGatewayType from '../enum/EGatewayType';

//内存中保存局域网扫描到的网关设备信息
interface IGatewayMap {
    ip: string;
    name: string; //'NSPanelPro.local'
    type: EGatewayType;
}

class MDnsGatewayMapClass {
    public mDnsGatewayMap: Map<string, IGatewayMap>;
    constructor() {
        this.mDnsGatewayMap = new Map();
    }
}
export default new MDnsGatewayMapClass();
