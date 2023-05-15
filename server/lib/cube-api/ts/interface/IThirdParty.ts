export interface IHeader {
	name: 'DiscoveryRequest' | 'DeviceStatesChangeReport' | 'DeviceOnlineChangeReport',
	message_id: string,
	version: string
}

export interface IEndpoint {
	serial_number: string,
	third_serial_number: string
}


export interface IThirdRequest {
	event: {
		header?: IHeader,
		endpoint?: IEndpoint,
		payload: any
	}
}