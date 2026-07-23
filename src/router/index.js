import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('../layouts/DefaultLayout.vue'),
      children: [
        {
          path: '',
          redirect: '/transactions',
        },
        {
          path: 'transactions',
          name: 'transactions',
          component: () => import('../pages/TheTransactions.vue'),
        },
        {
          path: 'accounts',
          name: 'accounts',
          component: () => import('../pages/TheAccounts.vue'),
        },
        {
          path: 'budgets',
          name: 'budgets',
          component: () => import('../pages/TheBudgets.vue'),
        },
      ],
    },
  ],
})

export default router
