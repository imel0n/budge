import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/transactions',
    },
    {
      path: '/transactions',
      name: 'transactions',
      component: () => import('../pages/TheTransactions.vue'),
    },
  ],
})

export default router
