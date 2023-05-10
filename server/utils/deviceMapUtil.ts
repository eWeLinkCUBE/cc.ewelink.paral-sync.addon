import DeviceMapClass from '../ts/class/deviceMap';
import { IMdnsParseRes } from '../ts/interface/IMdns';

//更新已搜索到的设备列表
async function setOnline(params: IMdnsParseRes) {
    let saveParams: any = params;
    //解决uiid 77 丢a记录没有上报问题，
    if (DeviceMapClass.deviceMap.has(params.deviceId)) {
        const oldDevice = DeviceMapClass.deviceMap.get(params.deviceId);
        saveParams = params;
        if (!params.ip) {
            saveParams.ip = oldDevice?.deviceData.ip;
        }
    }

    saveParams.isOnline = true;
    DeviceMapClass.deviceMap.set(params.deviceId, {
        discoveryTime: Date.now(),
        deviceData: saveParams,
    });
}

/** 获取已搜索到的局域网设备 */
function getMDnsDeviceList() {
    let arr: any = Array.from(DeviceMapClass.deviceMap.entries());
    arr = arr.map((item: any) => {
        return {
            deviceId: item[0],
            ...item[1],
        };
    });
    return arr as {
        deviceId: string;
        discoveryTime: number;
        deviceData: IMdnsParseRes;
    }[];
}

export default {
    setOnline,
    getMDnsDeviceList,
};
