import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import PublicLayout from '@/layouts/PublicLayout.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'

import LoginView from '@/views/auth/LoginView.vue'
import RegisterView from '@/views/auth/RegisterView.vue'
import AdminPendingView from '@/views/auth/AdminPendingView.vue'
import ForgotPasswordView from '@/views/auth/ForgotPasswordView.vue'

import HomeView from '@/views/user/HomeView.vue'
import HealthInfoView from '@/views/user/HealthInfoView.vue'
import ActivitiesView from '@/views/user/ActivitiesView.vue'
import CareServiceView from '@/views/user/CareServiceView.vue'
import PersonalCenterView from '@/views/user/PersonalCenterView.vue'
import CloudRatingSummaryView from '@/views/user/CloudRatingSummaryView.vue'

import AdminDashboardView from '@/views/admin/AdminDashboardView.vue'
import UserManagementView from '@/views/admin/UserManagementView.vue'
import ContentManagementView from '@/views/admin/ContentManagementView.vue'
import ActivityManagementView from '@/views/admin/ActivityManagementView.vue'
import ServiceManagementView from '@/views/admin/ServiceManagementView.vue'
import SystemSettingsView from '@/views/admin/SystemSettingsView.vue'

const routes = [
  {
    path: '/',
    component: PublicLayout,
    children: [
      { path: '', name: 'home', component: HomeView },
      { path: 'health', name: 'health', component: HealthInfoView },
      { path: 'activities', name: 'activities', component: ActivitiesView },
      { path: 'care', name: 'care', component: CareServiceView },
      { path: 'me', name: 'me', component: PersonalCenterView, meta: { requiresAuth: true } },
      { path: 'cloud-rating-summary', name: 'cloud-rating-summary', component: CloudRatingSummaryView },

      { path: '/auth/login', name: 'login', component: LoginView, meta: { guestOnly: true } },
      { path: '/auth/register', name: 'register', component: RegisterView, meta: { guestOnly: true } },
      { path: '/auth/admin-pending', name: 'admin-pending', component: AdminPendingView, meta: { requiresAuth: true } },
      { path: '/auth/forgot-password', name: 'forgot-password', component: ForgotPasswordView, meta: { guestOnly: true } }
    ]
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: '', name: 'admin-dashboard', component: AdminDashboardView },
      { path: 'users', name: 'admin-users', component: UserManagementView },
      { path: 'content', name: 'admin-content', component: ContentManagementView },
      { path: 'activities', name: 'admin-activities', component: ActivityManagementView },
      { path: 'services', name: 'admin-services', component: ServiceManagementView },
      { path: 'settings', name: 'admin-settings', component: SystemSettingsView }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  auth.hydrate()

  if (to.meta.guestOnly && auth.isLoggedIn) {
    if (auth.role === 'admin') return '/admin'
    if (auth.role === 'admin-pending') return '/auth/admin-pending'
    return '/'
  }

  if (to.meta.requiresAuth && !auth.isLoggedIn) return '/auth/login'

  if (auth.isLoggedIn && auth.role === 'admin-pending') {
    if (to.path.startsWith('/admin')) return '/auth/admin-pending'
    if (to.path === '/me' || to.path.startsWith('/me')) return '/auth/admin-pending'
  }

  if (to.meta.requiresAdmin && auth.role !== 'admin') {
    return auth.role === 'admin-pending' ? '/auth/admin-pending' : '/'
  }

  return true
})

export default router
