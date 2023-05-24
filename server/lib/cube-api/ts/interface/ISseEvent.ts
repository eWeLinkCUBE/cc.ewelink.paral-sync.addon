export default interface ISseEvent{
	onopen?: (message: MessageEvent) => void
	onerror?: (message: MessageEvent) => void

	onAddDevice?: (message: MessageEvent) => void
	onUpdateDeviceState?: (message: MessageEvent) => void
	onUpdateDeviceInfo?: (message: MessageEvent) => void
	onUpdateDeviceOnline?: (message: MessageEvent) => void
	onDeleteDevice?: (message: MessageEvent) => void
}