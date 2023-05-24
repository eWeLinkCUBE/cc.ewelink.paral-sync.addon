import ihostClass from './api/ihostClass'
import nspanelproClass from './api/nspanelproClass'
export { IDevice } from './ts/interface/IDevice'
export { ECapability } from './ts/enum/ECapability'
export { ECategory } from './ts/enum/ECategory'
export { IThirdpartyDevice } from './ts/interface/IThirdpartyDevice'

const Api = {
	ihostApi: ihostClass,
	nspanelproApi: nspanelproClass
}

export default Api