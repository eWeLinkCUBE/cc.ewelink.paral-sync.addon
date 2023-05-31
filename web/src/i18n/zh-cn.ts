const cn = {
    ERROR:{
        500:'操作失败，请稍后重试',
        // 1001:'密码错误，请确认后重新登录',
        1002:'帐号格式有误',
        1003:'用户不存在，请确认后重新登录',
    },
    GET_TOKEN:'获取token',
    ALREADY_GET_TOKEN:'已获取token',
    SETTING:'设置',
    STEP01_TOKEN:'Step 01 获取本机Token',
    GET_ACCESS_TOKEN:'请点击获取token按钮获取本机的token以便将局域网内其他网关的设备同步到本机中',
    NEXT:'下一步',
    STEP02_TOKEN:'Step 02 获取NSPanelPro的Token',
    THE_FOLLOWING:'局域网内发现如下网关，点击获取token按钮进行授权，获取权限后可同步网关里的设备',
    STEP1:'点击“获取token”按钮',
    STEP2:'请前往屏端的“设置”>”关于本机”页面10s内连续点击“设备名称”7次',
    DEVICE_LIST:'设备列表',
    SYNCED_FROM_NSPANEL:'设备将从NSPanel Pro同步到iHost',
    AUTO_SYNC_NEW:'新增设备自动同步',
    ALL_DEVICES:'一键同步所有设备',
    DEVICE_NAME:'设备名称',
    DEVICE_ID:'设备ID',
    ACTION:'操作',
    CANCEL_SYNC:'取消同步',
    SYNC:'同步',
    DONE:'完成',
    NO_DATA: '暂无数据',
    PLEASE_START_IN_IHOST:'请在 iHost中安装运行“Add-on name”',
    IP_FAILED:'IP无法访问',
    IP_FIND:'IP查找',
    CANCEL:'取消',
    CONNECT_IP_FAIL:'*IP 连接失败,请检查后重新输入',
    GET_NS_PRO_TOKEN:'获取NSPanel Pro 的token',
    GET_IT:'我知道了',
    SYNC_ALL_DEVICE_WAIT:'正在同步所有设备，请稍等',
    GATEWAY_IP_INVALID:'网关name IP无法连接，请到设置页面检查并更新(缺)',
    DEVICE_SYNC_SUCCESS:'{number} 个设备同步成功（缺）',
    IHOST_IP_INVALID:'{name} IP无法访问',
    TOKEN_INVALID:'{name} token已失效，请重新获取token(缺)',
    NS_PRO_IP_CANT_ACCESS:'{name} IP无法访问，请点击“查找”按钮重新输入IP,连接成功后恢复使用(缺)',
    SYNC_SUCCESS:'同步成功',
    CANCEL_SYNC_SUCCESS:'取消同步成功',
    GET_DEVICE_FAIL:'设备获取失败，请检查：（缺）',
    NS_PRO_RUN_NORMAL:'NSPanel Pro是否正常运行（缺）',
    NS_PRO_LOGIN:' 是否已在 NSPanel Pro 中登录易微联账号（缺）',
};

export default cn;
