enum EPath {
	ROOT = '/open-api',
	V1 = '/v1/rest',
	SSE = '/v1/sse/bridge',
	//	bridge module
	BRIDGE = '/bridge',
	BRIDGE_TOKEN = '/bridge/access_token',
	BRIDGE_RUNTIME = '/bridge/runtime',
	BRIDGE_CONFIG = '/bridge/config',

	//	hardware module
	HARDWARE_REBOOT = '/hardware/reboot',
	HARDWARE_SPEAKER = '/hardware/speaker',

	//	device module
	DEVICE_DISCOVERY = '/devices/discovery',
	DEVICE = '/devices',

	//	third-party
	THIRD_PARTY = '/thirdparty/event',

	// TTS engine
	TTS_ENGINE = '/tts/engines',

	//	debug-log
	DEBUG_LOG = '/thirdparty/debug-log'
}

export default EPath
