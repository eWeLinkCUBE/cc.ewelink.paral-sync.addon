import { v4 as uuid } from 'uuid';
import CubeApi from '../lib/cube-api';

function createDeviceList(n: number) {
    const deviceList = [];
    for (let i = 0; i < n; i++) {
        deviceList.push({
            name: '开关',
            third_serial_number: uuid(),
            manufacturer: 'eWeLink',
            model: 'ZB-SW03',
            firmware_version: '0.2',
            display_category: 'switch',
            capabilities: [{"capability":"power","permission":"readWrite"},{"capability":"toggle","permission":"readWrite","name":"1"},{"capability":"toggle","permission":"readWrite","name":"2"},{"capability":"toggle","permission":"readWrite","name":"3"},{"capability":"rssi","permission":"read"}],
            state: {"toggle":{"3":{"toggleState":"off"}},"rssi":{"rssi":-59}},
            tags: {
                __nsproAddonData: {
                    srcGatewayMac: 'AA:BB:CC:DD:EE:FF',
                    deviceId: 'a1234567'
                }
            },
            service_address: 'http://192.168.31.145:8322/api/v1/open/device',
        });
    }
    return deviceList as any;
}

function wait(t: number) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(1)
        }, t);
    });
}

async function test() {
    const ApiClient = CubeApi.ihostApi;
    const apiClient = new ApiClient({ ip: '192.168.31.214', at: '20575406-17be-4364-949e-389ef0398ed1' });
    let cubeApiRes;

    // cubeApiRes = await apiClient.getBridgeInfo();
    // console.log(JSON.stringify(cubeApiRes));

    // cubeApiRes = await apiClient.getBridgeAT({});
    // console.log(JSON.stringify(cubeApiRes));

    //const deviceList = createDeviceList(10);
    //console.log('time 1:\n', Date.now());
    //cubeApiRes = await apiClient.syncDevices({ devices: deviceList });
    //console.log('time 2:\n', Date.now());
    //console.log('sync result:\n', JSON.stringify(cubeApiRes));
    //await wait(10000);

    console.log('time 3:\n', Date.now());
    cubeApiRes = await apiClient.getDeviceList();
    console.log('time 4:\n', Date.now());
    console.log('device:\n', JSON.stringify(cubeApiRes));

    //for (const device of cubeApiRes.data.device_list) {
    //    await apiClient.deleteDevice(device.serial_number);
    //}

}

test();
