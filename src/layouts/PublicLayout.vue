<script setup>
import { onMounted } from 'vue'
import AppHeader from '@/components/common/AppHeader.vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useAppDataStore } from '@/stores/appData'

const auth = useAuthStore()
const ui = useUiStore()
const app = useAppDataStore()

onMounted(() => {
  ui.hydrate()
  auth.hydrate?.()
  app.hydrate?.()
})
</script>

<template>
  <div>
    <AppHeader />
    <main id="main-content" class="container main-content" tabindex="-1">
      <router-view />
    </main>
  </div>
</template>
