import { stepsList } from '@/api/ts/interface/IGateWay';
import { useDeviceStore } from '@/store/device';
import router from '@/router';
import i18n from '@/i18n';
import { message } from 'ant-design-vue';
let MAX_RETRY_TIME = 15;
/**
 *
 * 根据路径获取assets文件夹内的文件（主要用于图片）
 * @date 29/05/2023
 * @export
 * @param {string} url
 * @returns {*}
 */
 export function getAssetsFile(url: string) {
    return new URL(`../assets/${url}`, import.meta.url).href
};

/**
 *
 * 错误码处理
 * @date 29/05/2023
 * @export
 * @param {number} errCode
 * @returns {*}
 */
export function jumpCorrespondStep(errCode:number){
    //设置页面用到的所有接口根据错误码跳转设置页对应的步骤,设置页面红字提示;
    const isDevicePage = location.hash.indexOf('/deviceList') !== -1;
    if (isDevicePage) return;
    const deviceStore = useDeviceStore();
    const step1List = [ 602,603,604,606,607,608,701,702,703 ];
    const step2List = [ 501,502,503,600,601,1500,1501,1502,1503];
    if(step1List.includes(errCode)){
        deviceStore.setStep(stepsList.FIRST);
        router.push('/setting');
        deviceStore.getIHostGateWatList();
    }
    if(step2List.includes(errCode)){
        deviceStore.setStep(stepsList.SECOND);
        router.push('/setting');
        deviceStore.getNsProGateWayList();
    }
}

/**
 *
 * 对iHost和nsPro的ip失效和token失效进行处理
 * @date 02/06/2023
 * @param {string} errCode
 * @returns {*}
 */
export function handleIpAndToken(errCode:number){
    const deviceStore = useDeviceStore();
    let ipTokenMsg =''
    let ipTokenStep = deviceStore.step;
    if([701,702,703,1500,1501,1502].includes(errCode)){
        deviceStore.setIpTokenStatus(false);
        switch(errCode){
            //无目标网关信息、IP失效
            case 701:
            case 702:
                ipTokenMsg= i18n.global.t('GATEWAY_IP_INVALID',{name:'iHost'});
                ipTokenStep = stepsList.FIRST;
                break;
            //目标网关token失效
            case 703:
                ipTokenMsg= i18n.global.t('GATEWAY_TOKEN_INVALID',{name:'iHost'});
                ipTokenStep = stepsList.FIRST;
                break;
            //无来源网关信息、IP失效
            case 1500:
            case 1501:
                ipTokenMsg= i18n.global.t('GATEWAY_IP_INVALID',{name:'NSPanelPro'});
                ipTokenStep = stepsList.SECOND;
                break;
            //来源网关token失效
            case 1502:
                ipTokenMsg= i18n.global.t('GATEWAY_TOKEN_INVALID',{name:'NSPanelPro'});
                ipTokenStep = stepsList.SECOND;
                break;
            default:
                break;
        }
        deviceStore.setIpTokenMsg(ipTokenMsg);
        deviceStore.setIpTokenStep(ipTokenStep);
    }
}

/**
 *
 * ip校验（link IP）
 * @date 30/05/2023
 * @export
 * @param {string} ip
 * @returns {*}
 */
export function checkIpValid(ipAddress:string){
    const reg = new RegExp(/^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/);
    if (!reg.test(ipAddress)) {
        return false;
    }
    return true;
}

/**
 *
 * 睡眠函数
 * @date 01/06/2023
 * @param {number} time
 */
export function sleep(time: number) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(1);
        }, time)
    })
}

/**
 *
 * 判断有多少设备提示成功，并且提示用户
 * @date 07/06/2023
 * @param {number} time
 */
export const deviceSyncSuccessNum = async (syncDeviceIdList: string[]) =>{
    const deviceStore =useDeviceStore();
    if (!syncDeviceIdList || syncDeviceIdList.length < 1) {
        console.log('sync success device number is empty');
        return;
    }
    if (!deviceStore.deviceList || deviceStore.deviceList.length < 1) {
        console.log('nsPro deviceList number is empty');
        return;
    }
    let count = 0;
    for (const item of syncDeviceIdList) {
        for (const element of deviceStore.deviceList) {
            if (item === element.id && element.isSynced) {
                count++;
                break;
            }
        }
    }
    //当同步设备全部是同步成功状态，结束loading并且提示成功;
    if (count === syncDeviceIdList.length) {
        message.success(i18n.global.t('DEVICE_SYNC_SUCCESS', { number: count }));
        return;
    } else {
        deviceStore.setRetryTime();
        if (deviceStore.retryTime <= MAX_RETRY_TIME) {
            await deviceStore.getDeviceList();
            await sleep(2000); //15*2=30(s)
            await deviceSyncSuccessNum(syncDeviceIdList);
        } else {
            // 三十秒还没成功,提示成功的数量;
            message.success(i18n.global.t('DEVICE_SYNC_SUCCESS', { number: count }));
            return;
        }
    }
};
