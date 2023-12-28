/** 设备类别 category */
enum ECategory {
    /** 
    * 插座
    * plug
    */
    PLUG = 'plug',
    /**
     * 开关
     * switch
     */
    SWITCH = 'switch',
    /**
     * 窗帘
     * curtain
     */
    CURTAIN = 'curtain',
    /**
     * 灯
     * light
     */
    LIGHT = 'light',
    /**
     * 水浸传感器
     * water immersion sensor
     */
    WATER_LEAK_DETECTOR = 'waterLeakDetector',
    /**
     * 烟雾传感器
     * smoke sensor
     */
    SMOKE_DETECTOR = 'smokeDetector',
    /**
     * 无线按钮
     * wireless button
     */
    BUTTON = 'button',
    /**
     * 温湿度传感器
     * Temperature and humidity sensor
     */
    TEMPERATURE_AND_HUMIDITY_SENSOR = 'temperatureAndHumiditySensor',
    /**
     * 温度传感器
     * Temperature Sensor
     */
    TEMPERATURE_SENSOR = 'temperatureSensor',
    /**
     * 湿度传感器
     * Humidity Sensor
     */
    HUMIDITY_SENSOR = 'humiditySensor',
    /**
     * 门磁
     * contact sensor
     */
    CONTACT_SENSOR = 'contactSensor',
    /**
     * 人体传感器
     * human body sensor
     */
    MOTION_SENSOR = 'motionSensor',
}
export default ECategory;
