// iHost请求addon的参数 request params for iHost to add-on
export interface IReqData {
    directive: {
        header: {
            name: string;
            message_id: string;
            version: string;
        };
        endpoint: {
            serial_number: string;
            third_serial_number: string;
            tags: {
                deviceInfo: string;
            };
        };
        payload: {
            state: object;
        };
    };
}
