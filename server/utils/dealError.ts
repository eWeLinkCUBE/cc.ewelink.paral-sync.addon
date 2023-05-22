import db from "./db"

async function dealWithTokenInvalid(mac: string) {
    const destGatewayInfo = db.getDbValue('destGatewayInfo');
    const gatewayInfoList = db.getDbValue('gatewayInfoList');
}


export default {}