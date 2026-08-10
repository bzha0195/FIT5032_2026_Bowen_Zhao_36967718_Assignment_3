<script setup>
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()
function logout() {
  auth.logout()
  router.push('/auth/login')
}
</script>

<template>
  <div class="admin-shell">
    <aside class="admin-side card">
      <h3>Admin Side</h3>
      <nav>
        <RouterLink to="/admin">Data Dashboard</RouterLink>
        <RouterLink to="/admin/users">User Management</RouterLink>
        <RouterLink to="/admin/content">Content Management</RouterLink>
        <RouterLink to="/admin/activities">Activity Management</RouterLink>
        <RouterLink to="/admin/services">Service Management</RouterLink>
        <RouterLink to="/admin/settings">System Settings</RouterLink>
      </nav>
      <button class="btn btn-pill-dark" @click="logout">Logout</button>
    </aside>

    <main class="admin-main">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.admin-shell { display: grid; grid-template-columns: 260px 1fr; gap: 16px; padding: 16px; }
.admin-side nav { display: grid; gap: 8px; margin: 12px 0; }
.admin-main { min-height: 80vh; }
@media (max-width: 900px) { .admin-shell { grid-template-columns: 1fr; } }
</style>
