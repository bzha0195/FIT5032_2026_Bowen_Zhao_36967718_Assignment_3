<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import FontSizeSwitcher from '@/components/common/FontSizeSwitcher.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const isAdmin = computed(() => auth.user?.role === 'admin')

const navLinks = [
  { to: '/', label: 'Home', exact: true },
  { to: '/health', label: 'Health Information' },
  { to: '/activities', label: 'Charity Activity' },
  { to: '/care', label: 'Care Service' },
  { to: '/me', label: 'Personal Center' }
]

function isActive(link) {
  if (link.exact) return route.path === link.to
  return route.path === link.to || route.path.startsWith(link.to + '/')
}

function goAccount() {
  if (!auth.user) return router.push('/auth/login')
  router.push(auth.user.role === 'admin' ? '/admin' : '/me')
}

function onRightButtonClick() {
  if (!auth.user) return router.push('/auth/login')
  auth.logout()
  router.push('/auth/login')
}
</script>

<template>
  <header class="site-header">
    <div class="container nav-wrap" v-if="!isAdmin">
      <div class="left-zone">
        <FontSizeSwitcher />
      </div>

      <div class="right-zone">
        <button class="pill dark" @click="onRightButtonClick">
          {{ auth.user ? 'Logout' : 'Login' }}
        </button>
      </div>

      <nav class="center-nav desktop-nav">
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="nav-link"
          :class="{ active: isActive(link) }"
        >
          {{ link.label }}
        </RouterLink>
      </nav>

      <nav class="center-nav nav-576-768">
        <div class="row3">
          <RouterLink to="/" class="nav-link" :class="{ active: route.path === '/' }">Home</RouterLink>
          <RouterLink to="/health" class="nav-link" :class="{ active: route.path === '/health' || route.path.startsWith('/health/') }">Health Information</RouterLink>
          <RouterLink to="/activities" class="nav-link" :class="{ active: route.path === '/activities' || route.path.startsWith('/activities/') }">Charity Activity</RouterLink>
        </div>
        <div class="row2">
          <RouterLink to="/care" class="nav-link" :class="{ active: route.path === '/care' || route.path.startsWith('/care/') }">Care Service</RouterLink>
          <RouterLink to="/me" class="nav-link" :class="{ active: route.path === '/me' || route.path.startsWith('/me/') }">Personal Center</RouterLink>
        </div>
      </nav>

      <nav class="center-nav nav-lt-576">
        <div class="row2">
          <RouterLink to="/" class="nav-link" :class="{ active: route.path === '/' }">Home</RouterLink>
          <RouterLink to="/health" class="nav-link" :class="{ active: route.path === '/health' || route.path.startsWith('/health/') }">Health Information</RouterLink>
        </div>
        <div class="row2">
          <RouterLink to="/activities" class="nav-link" :class="{ active: route.path === '/activities' || route.path.startsWith('/activities/') }">Charity Activity</RouterLink>
          <RouterLink to="/care" class="nav-link" :class="{ active: route.path === '/care' || route.path.startsWith('/care/') }">Care Service</RouterLink>
        </div>
        <div class="row1">
          <RouterLink to="/me" class="nav-link" :class="{ active: route.path === '/me' || route.path.startsWith('/me/') }">Personal Center</RouterLink>
        </div>
      </nav>
    </div>

    <div class="container nav-wrap admin-wrap" v-else>
      <div class="left-zone">
        <FontSizeSwitcher />
      </div>

      <nav class="center-nav desktop-nav">
        <RouterLink to="/admin" class="nav-link" :class="{ active: route.path === '/admin' || route.path.startsWith('/admin/') }">Dashboard</RouterLink>
        <RouterLink to="/admin/users" class="nav-link" :class="{ active: route.path === '/admin/users' || route.path.startsWith('/admin/users/') }">Users</RouterLink>
        <RouterLink to="/admin/contents" class="nav-link" :class="{ active: route.path === '/admin/contents' || route.path.startsWith('/admin/contents/') }">Content</RouterLink>
        <RouterLink to="/admin/activities" class="nav-link" :class="{ active: route.path === '/admin/activities' || route.path.startsWith('/admin/activities/') }">Activities</RouterLink>
        <RouterLink to="/admin/services" class="nav-link" :class="{ active: route.path === '/admin/services' || route.path.startsWith('/admin/services/') }">Services</RouterLink>
        <RouterLink to="/admin/settings" class="nav-link" :class="{ active: route.path === '/admin/settings' || route.path.startsWith('/admin/settings/') }">Settings</RouterLink>
      </nav>

      <div class="right-zone">
        <button class="pill dark" @click="onRightButtonClick">
          {{ auth.user ? 'Logout' : 'Login' }}
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.nav-wrap {
  min-height: calc(var(--ctrl-h) + 26px);
  display: grid;
  grid-template-columns: 170px minmax(0, 1fr) 170px;
  grid-template-areas: "left center right";
  align-items: center;
  gap: 8px;
  padding: 8px 0;
}

.left-zone {
  grid-area: left;
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

.right-zone {
  grid-area: right;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.desktop-nav,
.nav-576-768,
.nav-lt-576 {
  grid-area: center;
}

.center-nav {
  min-width: 0;
}

.desktop-nav {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: clamp(16px, 1.8vw, 30px);
  flex-wrap: nowrap;
  overflow: visible;
}

.nav-wrap :deep(a),
.nav-wrap :deep(a:hover),
.nav-wrap :deep(a:focus),
.nav-wrap :deep(a:visited),
.nav-link,
.nav-link:hover,
.nav-link:focus,
.nav-link:visited {
  text-decoration: none !important;
}

.nav-link {
  font-size: var(--fs-nav);
  font-weight: 700;
  line-height: 1.12;
  white-space: nowrap;
  padding-bottom: 2px;
  border-bottom: 2px solid transparent;
}

.nav-link.active {
  border-bottom-color: #374151;
}

.pill {
  min-height: var(--ctrl-h);
  padding: 0 var(--ctrl-px);
  border-radius: 999px;
  font-size: var(--fs-btn);
  font-weight: 700;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.pill.dark {
  border: 1px solid #374151;
  background: #374151;
  color: #fff;
}

.nav-576-768,
.nav-lt-576 {
  display: none;
}

.row3,
.row2,
.row1 {
  display: flex;
  justify-content: center;
  align-items: center;
}

.row3 { gap: 20px; }
.row2 { gap: 22px; }
.row1 { gap: 0; }

@media (min-width: 992px) and (max-width: 1200px) {
  .nav-wrap {
    grid-template-columns: 150px minmax(0, 1fr) 150px;
    gap: 6px;
  }

  .left-zone { justify-content: flex-start; }
  .right-zone { justify-content: flex-end; }

  .desktop-nav {
    gap: 14px;
  }

  .nav-link {
    font-size: calc(var(--fs-nav) - 1px);
  }
}

@media (min-width: 576px) and (max-width: 768px) {
  .nav-wrap {
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      "left right"
      "center center";
    row-gap: 10px;
    column-gap: 0;
  }

  .left-zone {
    justify-content: center;
  }

  .right-zone {
    justify-content: center;
  }

  .desktop-nav,
  .nav-lt-576 {
    display: none;
  }

  .nav-576-768 {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .row3 .nav-link,
  .row2 .nav-link {
    font-size: var(--fs-nav);
  }
}

@media (max-width: 575.98px) {
  .nav-wrap {
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      "left right"
      "center center";
    row-gap: 10px;
    column-gap: 0;
  }

  .left-zone {
    justify-content: center;
  }

  .right-zone {
    justify-content: center;
  }

  .desktop-nav,
  .nav-576-768 {
    display: none;
  }

  .nav-lt-576 {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .row2 .nav-link,
  .row1 .nav-link {
    font-size: calc(var(--fs-nav) - 1px);
  }
}

@media (min-width: 1400px) {
  .desktop-nav {
    gap: 30px;
  }
}
</style>
