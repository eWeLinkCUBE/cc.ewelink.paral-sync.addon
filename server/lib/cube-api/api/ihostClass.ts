import EMethod from "../ts/enum/EMethod";
import EPath from "../ts/enum/EPath";
import baseClass from "./baseClass";

export default class ihostClass extends baseClass {
	constructor(config: { ip: string, at?: string, debug?: boolean }) {
		super(config)
	}
	/**
	 * 获取网关运行状态
	 */
	async getBridgeRuntimeState() {
		return await this.httpRequest({ path: EPath.BRIDGE_RUNTIME, method: EMethod.GET })
	}
}
