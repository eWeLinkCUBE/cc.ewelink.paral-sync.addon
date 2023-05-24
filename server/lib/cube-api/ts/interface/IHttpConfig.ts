import EMethod from "../enum/EMethod"

interface IHttpConfig {
	path: string,
	method: EMethod,
	params?: any,
	isNeedAT?: boolean
}

export default IHttpConfig