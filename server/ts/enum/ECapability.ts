enum ECapability {
    RSSI = 'rssi',
    POWER = 'power',
    TOGGLE = 'toggle',
    //功率检测
    ELECTRIC_POWER = 'electric-power',
    VOLTAGE = 'voltage',
    ELECTRIC_CURRENT = 'electric-current',
    //功率统计
    POWER_CONSUMPTION = 'power-consumption',
    BRIGHTNESS = 'brightness',
    COLOR_TEMPERATURE = 'color-temperature',
    COLOR_RGB = 'color-rgb',

    TEMPERATURE = 'temperature',
    HUMIDITY = 'humidity',
    //模式控制
    MODE = 'mode',
    MOTOR_CONTROL = 'motor-control',
    PERCENTAGE = 'percentage',
    //行程校准
    MOTOR_CLB = 'motor-clb',
    PRESS = 'press',
}
export default ECapability;
