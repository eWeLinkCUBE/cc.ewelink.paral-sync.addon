export default interface IDebugLog {
	serial_number: string,
	type: 'event_log' | 'directive_log',
	from_index?: number,
	start_time?: number,
	end_time?: number,
	limit?: number,
	order?: 'DESC' | 'ASC'
}