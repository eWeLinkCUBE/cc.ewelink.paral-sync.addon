import { createRouter, createWebHashHistory } from 'vue-router'
import DeviceList from '@/views/DeviceList/Index.vue'
import Setting from '@/views/Setting/Index.vue'

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            redirect: '/deviceList'
        },
        {
            path:'/deviceList',
            name:'deviceList',
            component: DeviceList,
        },
        {
            path:'/setting',
            name:'setting',
            component: Setting,
        }
    ]
})

router.beforeEach((to, from) => {

})


export default router
