import { GatewayDeviceItem } from '../ts/interface/CubeApi';
import ECategory from '../ts/enum/ECategory';
import ECapability from '../ts/enum/ECapability';
import _ from 'lodash';

/** 对应类别必要的能力（设备只能比它多能力，不能少） */
const categoryCapabilityObj = {
    [ECategory.PLUG]: [ECapability.POWER],
    [ECategory.SWITCH]: [ECapability.POWER],
    [ECategory.CURTAIN]: [ECapability.MOTOR_CONTROL],
    [ECategory.LIGHT]: [ECapability.POWER, ECapability.BRIGHTNESS],
    [ECategory.WATER_LEAK_DETECTOR]: [ECapability.DETECT],
    [ECategory.SMOKE_DETECTOR]: [ECapability.DETECT],
    [ECategory.BUTTON]: [ECapability.PRESS],
    [ECategory.TEMPERATURE_AND_HUMIDITY_SENSOR]: [ECapability.HUMIDITY, ECapability.TEMPERATURE],
    [ECategory.TEMPERATURE_SENSOR]: [ECapability.TEMPERATURE],
    [ECategory.HUMIDITY_SENSOR]: [ECapability.HUMIDITY],
    [ECategory.CONTACT_SENSOR]: [ECapability.DETECT],
    [ECategory.MOTION_SENSOR]: [ECapability.DETECT],
};

/** 当前iHost不支持的设备能力 */
const unSupportCapabilityList = [ECapability.IDENTIFY, ECapability.THERMOSTAT_MODE_DETECT, ECapability.TAMPER_ALERT, ECapability.MULTI_PRESS];

/** 根据设备类别和设备能力判断该设备在iHost中是否支持 */
export function isSupportDevice(deviceData: GatewayDeviceItem) {
    const { display_category, capabilities } = deviceData;

    //设备能力
    const deviceCapabilityList = capabilities.map((item: { capability: ECapability }) => item.capability);

    //是否存在不支持的能力
    const isExistUnSupportCapability = deviceCapabilityList.some((item: ECapability) => unSupportCapabilityList.includes(item));
    //设备存在不支持的能力，显示为不支持
    if (isExistUnSupportCapability) {
        return false;
    }

    //必要能力
    const minCapabilityList = _.get(categoryCapabilityObj, display_category, []);
    //不支持类别
    if (minCapabilityList.length === 0) return false;

    //设备能力包含必要能力
    const commonCapList = _.intersection(deviceCapabilityList, minCapabilityList);
    return commonCapList.length === minCapabilityList.length;
}
