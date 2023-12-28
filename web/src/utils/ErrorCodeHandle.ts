import { message } from "ant-design-vue";
import i18n from "@/i18n/index";
import errorI18n from '@/i18n/en-us';
import { handleIpAndToken } from '@/utils/tools'

function ErrorCodeHandle(error: number) {

    /** 
    * ip或token失效的提示
    * Tips for invalid IP or token
    */
    handleIpAndToken(error);

    // 如果不存在错误码的翻译，不弹出错误消息 If there is no translation of the error code, no error message will pop up.
    if (!errorI18n.ERROR.hasOwnProperty(error)) {
        return;
    }
    message.error(i18n.global.t(`ERROR.${error}`));
}

export default ErrorCodeHandle;
