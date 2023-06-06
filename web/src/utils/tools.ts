import { stepsList } from '@/api/ts/interface/IGateWay';
import { useDeviceStore } from '@/store/device';
import router from '@/router';
import i18n from '@/i18n';
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
    //设置页面用到的所有接口根据错误码跳转设置页对应的步骤，设置页面只红字提示
    if (location.hash.indexOf('/deviceList') !== -1) return;
    const deviceStore = useDeviceStore();
    const step1List = [ 602,603,604,606,607,608,701,702,703 ];
    const step2List = [ 501,502,503,600,601,1500,1501,1502,1503];
    if(step1List.includes(errCode)){
        deviceStore.setStep(stepsList.FIRST);
        router.push('/setting');
        deviceStore.getIHostGateWatList();
        console.log('errCode jump first step--------->',errCode,deviceStore.step);
    }
    if(step2List.includes(errCode)){
        deviceStore.setStep(stepsList.SECOND);
        router.push('/setting');
        deviceStore.getNsProGateWayList();
        console.log('errCode jump second step--------->',errCode,deviceStore.step);
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
        console.log('errCode2222222222',errCode);
        switch(errCode){
            //无目标网关信息、IP失效
            case 701:
            case 702:
                ipTokenMsg= i18n.global.t('GATEWAY_IP_INVALID',{name:'iHost'});
                ipTokenStep = stepsList.FIRST;
                // deviceStore.getIHostGateWatList();
                break;
            //目标网关token失效
            case 703:
                ipTokenMsg= i18n.global.t('GATEWAY_TOKEN_INVALID',{name:'iHost'});
                ipTokenStep = stepsList.FIRST;
                // deviceStore.getIHostGateWatList();
                break;
            //无来源网关信息、IP失效
            case 1500:
            case 1501:
                ipTokenMsg= i18n.global.t('GATEWAY_IP_INVALID',{name:'NsPanelPro'});
                ipTokenStep = stepsList.SECOND;
                // deviceStore.getNsProGateWayList();
                break;
            //来源网关token失效
            case 1502:
                ipTokenMsg= i18n.global.t('GATEWAY_TOKEN_INVALID',{name:'NsPanelPro'});
                ipTokenStep = stepsList.SECOND;
                // deviceStore.getNsProGateWayList();
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
