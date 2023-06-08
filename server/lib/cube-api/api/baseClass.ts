import axios, { AxiosRequestConfig } from 'axios'
import { v4 as uuid } from 'uuid'
import EventSource from 'eventsource'

import EMethod from "../ts/enum/EMethod"
import EPath from "../ts/enum/EPath"
import { IThirdRequest } from "../ts/interface/IThirdParty"
import IDebugLog from "../ts/interface/IDebugLog"
import { IThirdpartyDevice } from "../ts/interface/IThirdpartyDevice"
import IHttpConfig from "../ts/interface/IHttpConfig"
import IResponse from "../ts/interface/IResponse"
import ISseEvent from '../ts/interface/ISseEvent'

import logger from '../../../log';

export default abstract class baseClass {
	private ip: string = ''
	private at: string = 'fcb79458-b3a2-4255-b2ca-5fef83dae38d'
	private debug: boolean = false
	interval: NodeJS.Timer | null = null
	timeout: NodeJS.Timeout | null = null
	time = new Date().getTime()

	public event: EventSource | null = null


	constructor({ ip, at = '', debug = false }: { ip: string, at?: string, debug?: boolean }) {
		this.ip = ip
		this.at = at
		this.debug = debug
	}

	setIp(ip: string) {
		this.ip = ip
	}
	getIp() {
		return this.ip
	}
	setAT(at: string) {
		this.at = at
	}
	getAt() {
		return this.at
	}
	/**
	 * 获取网关访问凭证
	 */
	async getBridgeAT({ timeout = 120000, interval = 2000 }: { timeout?: number, interval?: number }, appName?: string) {
		return new Promise(async (resolve) => {
			//	start interval
			//	nspanelpro first request maybe get response
			const resp = await this.getBridgeATHandler(appName)
			resp && resolve(resp)

			this.interval = setInterval(async () => {
				const resp = await this.getBridgeATHandler(appName)
				if (resp) {
					this.interval && clearInterval(this.interval)
					this.timeout && clearTimeout(this.timeout)
					resolve(resp)
				}
			}, interval)
			this.timeout = setTimeout(() => {
				this.interval && clearInterval(this.interval)
				this.timeout && clearTimeout(this.timeout)
				resolve({ error: 1001, msg: 'timeout', data: {} })
			}, timeout)
		})
	}
	private async getBridgeATHandler(appName?: string) {
		// console.log('----->', new Date().getTime() - this.time);
		const queryParams = appName ? { app_name: appName } : {};
		const resp = await this.httpRequest({ path: EPath.BRIDGE_TOKEN, method: EMethod.GET, isNeedAT: false, params: queryParams })
		// logger.info(`AAAAAAAAAAAAAAAAAAAAAAAAAAAAATTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT: ${JSON.stringify(resp)}`);
		if (resp.error === 0) {
			this.interval && clearInterval(this.interval)
			//	set at
			resp.data.token && this.setAT(resp.data.token)
			return resp
		}
	}
	/**
	 * 修改网关设置
	 */
	async updateBridgeConfig(volume: number) {
		return await this.httpRequest({ path: EPath.BRIDGE_CONFIG, method: EMethod.PUT, params: { volume } })
	}

	/**
	 * 获取网关信息
	 */
	async getBridgeInfo() {
		const resp = await this.httpRequest({ path: EPath.BRIDGE, method: EMethod.GET, isNeedAT: false })
		// if (resp.error === 0 && resp.data.mac) {
		// 	//	set mac
		// 	store.setMac(resp.data.mac)
		// }
		return resp
	}

	/**
	 * 重启网关
	 */
	async rebootBridge() {
		return await this.httpRequest({ path: EPath.HARDWARE_REBOOT, method: EMethod.POST })
	}

	/**
	 * 扬声器控制
	 */
	async controlSpeaker(params: {
		type: 'play_sound' | 'play_beep',
		sound?: {
			name: string,
			volume: number,
			countdown: number
		},
		beep?: {
			name: string,
			volume: number,
		}
	}) {
		return await this.httpRequest({ path: EPath.HARDWARE_SPEAKER, method: EMethod.POST, params })
	}

	/**
	 * 搜索子设备
	 */
	async discoverySubDevices(params: {
		enable: boolean,
		type: string
	}) {
		return await this.httpRequest({
			path: EPath.DEVICE_DISCOVERY,
			method: EMethod.PUT,
			params
		})
	}

	/**
	 * 手动添加子设备 (目前仅支持添加RTSP摄像头和ESP32摄像头)
	 */
	async manualAddSubDevice(params: {
		name: string,
		display_category: 'camera',
		capabilities: [],
		protocol: 'RTSP' | 'ESP32-CAM',
		manufacturer: string,
		model: string,
		firmware_version: string
	}) {
		return await this.httpRequest({ path: EPath.DEVICE, method: EMethod.POST, params })
	}

	/**
	 * 获取设备列表
	 */
	async getDeviceList() {
		return await this.httpRequest({ path: EPath.DEVICE, method: EMethod.GET })
	}

	/**
	 * 更新指定设备信息或状态
	 */
	async updateDeviceState(serial_number: string, updateParams?: {
		name?: string,
		tags?: any,
		state?: any,
		configuration?: any
	}) {
		return await this.httpRequest({
			path: `${EPath.DEVICE}/${serial_number}`,
			method: EMethod.PUT,
			params: { ...updateParams }
		})
	}

	/**
	 * 删除子设备
	 */
	async deleteDevice(serial_number: string) {
		return await this.httpRequest({
			path: `${EPath.DEVICE}/${serial_number}`,
			method: EMethod.DELETE
		})
	}

	/**
	 * 同步新设备列表
	 */
	async syncDevices({ devices, version = '1' }: { devices: IThirdpartyDevice[], version?: string }) {

		if (version !== '1') return { error: 1000, msg: 'version must be 1', data: {} }
		const request: IThirdRequest = {
			event: {
				header: {
					name: 'DiscoveryRequest',
					message_id: uuid(),
					version
				},
				payload: {
					endpoints: devices
				}
			}
		}
		return await this.httpRequest({ path: EPath.THIRD_PARTY, method: EMethod.POST, params: request })
	}

	/**
	 * 注册 TTS 引擎
	 *
	 * @param params.serviceName 服务名称
	 * @param params.serviceAddr 服务地址
	 */
	async registerTtsEngine(params: { serviceName: string; serviceAddr: string; }) {
		const request = {
			event: {
				header: {
					name: 'RegisterTTSEngine',
					message_id: uuid(),
					version: '1'
				},
				payload: {
					service_address: params.serviceAddr,
					name: params.serviceName
				}
			}
		}
		return await this.httpRequest({
			path: EPath.THIRD_PARTY,
			method: EMethod.POST,
			params: request
		})
	}

	/**
	 * 获取已注册 TTS 引擎列表
	 */
	async getTtsEngineList() {
		return await this.httpRequest({
			path: EPath.TTS_ENGINE,
			method: EMethod.GET
		})
	}

	/**
	 * 设备状态更新上报
	 */
	async uploadDeviceState(
		{ serial_number, third_serial_number, params, version = '1' }:
			{ serial_number: string, third_serial_number: string, params: any, version?: string }) {

		if (version !== '1') return { error: 1000, msg: 'version must be 1', data: {} }
		const request: IThirdRequest = {
			event: {
				header: {
					name: 'DeviceStatesChangeReport',
					message_id: uuid(),
					version
				},
				endpoint: {
					serial_number,
					third_serial_number
				},
				payload: params
			}
		}
		return await this.httpRequest({ path: EPath.THIRD_PARTY, method: EMethod.POST, params: request })
	}
	/**
	 * 设备上下线状态上报
	 */
	async updateDeviceOnline(
		{ serial_number, third_serial_number, params, version = '1' }:
			{ serial_number: string, third_serial_number: string, params: any, version?: string }) {

		if (version !== '1') return { error: 1000, msg: 'version must be 1', data: {} }
		const request: IThirdRequest = {
			event: {
				header: {
					name: 'DeviceOnlineChangeReport',
					message_id: uuid(),
					version
				},
				endpoint: {
					serial_number,
					third_serial_number
				},
				payload: params
			}
		}
		return await this.httpRequest({ path: EPath.THIRD_PARTY, method: EMethod.POST, params: request })
	}

	/**
	 * 获取调试日志接口
	 */
	async getDebugLog({ serial_number, ...params }: IDebugLog) {
		return await this.httpRequest({ path: `${EPath.DEBUG_LOG}/${serial_number}`, method: EMethod.GET, params })
	}

	protected async httpRequest(httpConfig: IHttpConfig): Promise<IResponse> {
		const { path, method, isNeedAT = true, params = {} } = httpConfig

		if (!this.ip) {
			return { error: 1000, msg: 'ip is needed', data: {} }
		}
		if (!this.at && isNeedAT) {
			return { error: 1000, msg: 'at is needed', data: {} }
		}

		const url = `http://${this.ip}${EPath.ROOT}${EPath.V1}${path}`

		const headers = {
			'Content-Type': 'application/json'
		}

		if (isNeedAT) {
			Object.assign(headers, {
				'Authorization': `Bearer ${this.at}`
			})
		}
		const config: AxiosRequestConfig = {
			url,
			method,
			headers,
			timeout: 60000
		}
		if (Object.keys(params).length) {
			if (method === EMethod.GET || method === EMethod.DELETE) {
				config.params = params
			} else {
				config.data = params
			}
		}

		this.debug && console.log('http request body---->', JSON.stringify(config))

		// logger.info(`**************** AXIOS CONFIG ****************${JSON.stringify(config)}`);
		try {
			const resp = await axios(config)
			// logger.info(`++++++++++++++++ AXIOS RESPONSE ++++++++++++++++ ${JSON.stringify(resp.data.error)}`);
			this.debug && console.log('http response body---->', JSON.stringify(resp.data))

			return resp.data
		} catch (error) {
			return { error: 1000, msg: 'http request catch error', data: error }
		}
		// return { error: 1000, msg: 'http request catch error', data: '' }
	}

	/**
	 * 初始化 sse 连接
	 */
	async initSSE() {
		if (!this.ip) {
			return { error: 1000, msg: 'ip is needed', data: {} }
		}
		if (!this.at) {
			return { error: 1000, msg: 'at is needed', data: {} }
		}
		const url = `http://${this.ip}${EPath.ROOT}${EPath.SSE}?access_token=${this.at}`
		console.log("🚀 ~ file: baseClass.ts:320 ~ baseClass ~ initSSE ~ url", url)
		try {
			this.event = new EventSource(url)
		} catch (error) {
			console.log("🚀 ~ file: baseClass.ts:323 ~ baseClass ~ initSSE ~ error", error)
		}
	}
	mountSseFunc(handler: ISseEvent) {
		if (!this.event) return { error: 1000, msg: 'must be invoke initSSE first', data: {} }

		handler.onopen && (this.event.onopen = handler.onopen)
		handler.onerror && (this.event.onerror = handler.onerror)

		handler.onAddDevice && this.event.addEventListener('device#v1#addDevice', handler.onAddDevice)
		handler.onUpdateDeviceState && this.event.addEventListener('device#v1#updateDeviceState', handler.onUpdateDeviceState)
		handler.onUpdateDeviceInfo && this.event.addEventListener('device#v1#updateDeviceInfo', handler.onUpdateDeviceInfo)
		handler.onUpdateDeviceOnline && this.event.addEventListener('device#v1#updateDeviceOnline', handler.onUpdateDeviceOnline)
		handler.onDeleteDevice && this.event.addEventListener('device#v1#deleteDevice', handler.onDeleteDevice)
	}
	unmountSseFunc() {
		this.event?.removeEventListener('device#v1#addDevice', () => { })
		this.event?.removeEventListener('device#v1#updateDeviceState', () => { })
		this.event?.removeEventListener('device#v1#updateDeviceInfo', () => { })
		this.event?.removeEventListener('device#v1#updateDeviceOnline', () => { })
		this.event?.removeEventListener('device#v1#deleteDevice', () => { })
		this.event?.close()
	}
}
