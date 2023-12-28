// import { GatewayDeviceItem } from '../ts/interface/CubeApi';
// import ECategory from '../ts/enum/ECategory';
// import ECapability from '../ts/enum/ECapability';
// import { IGatewayInfoItem } from './db';
// import semver from 'semver';
// import { SUPPORT_ALL_CAPABILITY_FW_VERSION } from './const';

// /** 
// * 对应类别必要的能力（设备只能比它多能力，不能少）
// * Necessary capabilities for the corresponding category (the device can only have more capabilities than it, not less)
// */
// const CATEGORY_CAP_MAPPING = {
//     [ECategory.PLUG]: [ECapability.POWER],
//     [ECategory.SWITCH]: [ECapability.POWER],
//     [ECategory.CURTAIN]: [ECapability.MOTOR_CONTROL],
//     [ECategory.LIGHT]: [ECapability.POWER, ECapability.BRIGHTNESS],
//     [ECategory.WATER_LEAK_DETECTOR]: [ECapability.DETECT],
//     [ECategory.SMOKE_DETECTOR]: [ECapability.DETECT],
//     [ECategory.BUTTON]: [ECapability.PRESS],
//     [ECategory.TEMPERATURE_AND_HUMIDITY_SENSOR]: [ECapability.HUMIDITY, ECapability.TEMPERATURE],
//     [ECategory.TEMPERATURE_SENSOR]: [ECapability.TEMPERATURE],
//     [ECategory.HUMIDITY_SENSOR]: [ECapability.HUMIDITY],
//     [ECategory.CONTACT_SENSOR]: [ECapability.DETECT],
//     [ECategory.MOTION_SENSOR]: [ECapability.DETECT],
// };

// /** 
// * 当前iHost不支持的设备能力
// * Device capabilities currently not supported by iHost
// */
// // const UNSUPPORTED_CAP = [ECapability.TAMPER_ALERT];

// /**
//  * @description 根据设备类别和设备能力判断该设备在iHost中是否支持 Determine whether the device is supported in iHost based on device category and device capabilities
//  * @export
//  * @param {GatewayDeviceItem} deviceData
//  * @returns {*} 
//  */
// export function isSupportDevice(deviceData: GatewayDeviceItem, destGatewayInfo: IGatewayInfoItem) {
//     const { display_category, capabilities } = deviceData;

//     // 设备能力 Device capacity
//     const deviceCapabilityList = capabilities.map((item: { capability: ECapability }) => item.capability);
//     // 是否存在不支持的能力 Are there any unsupported capabilities
//     // const isExistUnSupportCapability = deviceCapabilityList.some((item: ECapability) => UNSUPPORTED_CAP.includes(item));
//     // 是否满足最低版本要求 Are this src gateway fit the firmware version requirement
//     // const isOldVersion = semver.gte(destGatewayInfo.fwVersion, SUPPORT_ALL_CAPABILITY_FW_VERSION);
//     // 满足条件显示为不支持 meet the condition then displayed it as not supported.
//     // if (isExistUnSupportCapability && isOldVersion) {
//         // return false;
//     // }

//     return true;
//     // // 必要能力 necessary abilities
//     // const minCapabilityList = _.get(CATEGORY_CAP_MAPPING, display_category, []);
//     // // 不支持类别 Category not supported
//     // if (minCapabilityList.length === 0) return false;

//     // // 设备能力包含必要能力 Device capabilities include necessary capabilities
//     // const commonCapList = _.intersection(deviceCapabilityList, minCapabilityList);
//     // return commonCapList.length === minCapabilityList.length;
// }
