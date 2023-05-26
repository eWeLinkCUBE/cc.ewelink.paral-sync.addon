import CryptoJS from 'crypto-js';

/**
 *
 * AES解密字符串
 * @date 11/02/2023
 * @param {string} decryptStr
 * @param {string} key
 * @returns {*}  {string}
 */
function decryptAES(decryptStr: string, key: string): string {
    const decrypted = CryptoJS.AES.decrypt(decryptStr, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    })

    return CryptoJS.enc.Utf8.stringify(decrypted).toString();
}


/**
 *
 * AES加密字符串
 * @date 11/02/2023
 * @param {string} encryptStr
 * @param {string} key
 * @returns {*}  {string}
 */
function encryptAES(encryptStr: string, key: string): string {
    const encrypted = CryptoJS.AES.encrypt(encryptStr, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    })

    return encrypted.toString();
}

const encryptionBase64 = (str: string) => {
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(str));
};

const decryptionBase64 = (base64Str: string) => {
    return CryptoJS.enc.Base64.parse(base64Str).toString(CryptoJS.enc.Utf8);
};

export default {
    decryptAES,
    encryptAES,
    encryptionBase64,
    decryptionBase64,
};
