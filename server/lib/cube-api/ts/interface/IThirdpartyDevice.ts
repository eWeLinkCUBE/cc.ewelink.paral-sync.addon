import { ECategory } from "../enum/ECategory";
import { ICapability } from "./IDevice";

export interface IThirdpartyDevice {
	third_serial_number: string;
	name: string;
	display_category: ECategory;
	capabilities: ICapability[];
	state: any;
	manufacturer: string;
	model: string;
	tags?: any;
	firmware_version: string;
	service_address: string;
}