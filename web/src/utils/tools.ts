import { stepsList } from '@/api/ts/interface/IGateWay';
import { useDeviceStore } from '@/store/device';
import router from '@/router';
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
 * 错误码处理（设备列表页面用到的所有接口根据错误码跳转设置页对应的步骤）
 * @date 29/05/2023
 * @export
 * @param {number} errCode
 * @returns {*}
 */
export function jumpCorrespondStep(errCode:number){
    const deviceStore = useDeviceStore();
    const step1List = [ 602,603,604,606,607,608,701,702,703,1800 ];
    const step2List = [ 501,502,503,600,601,1500,1501,1502,1503];
    if(step1List.includes(errCode)){
        deviceStore.setStep(stepsList.FIRST);
        router.push('/setting');
        console.log('errCode jump first step--------->',errCode,deviceStore.step);
    }
    if(step2List.includes(errCode)){
        deviceStore.setStep(stepsList.SECOND);
        router.push('/setting');
        console.log('errCode jump second step--------->',errCode,deviceStore.step);
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
