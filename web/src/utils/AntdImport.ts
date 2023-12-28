import { Modal, Tabs, Spin, Select, Input, Button, Form, Popover, Tooltip, Switch ,Pagination ,Carousel} from 'ant-design-vue';
import type { App } from '@vue/runtime-core';
const components = [Modal, Tabs, Spin, Select, Input, Button, Form, Popover, Tooltip, Switch,Pagination,Carousel];

export default function (app: App<Element>) {
    components.forEach((item) => {
        app.use(item);
    });
}
