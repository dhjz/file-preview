import { createRouter, createWebHistory } from 'vue-router'
import IndexView from '@/views/index.vue'

export default createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            component: IndexView
        }
    ]
})
