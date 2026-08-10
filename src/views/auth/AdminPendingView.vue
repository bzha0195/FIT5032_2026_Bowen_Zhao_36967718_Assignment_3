<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

function backToLogin() {
  auth.logout()
  router.push('/auth/login')
}
</script>

<template>
  <section class="wire card auth-card">
    <h2>Your account is pending administrator approval.</h2>
    <p class="sub">
      Your administrator registration has been submitted successfully. This account is currently pending approval.
      You can access the admin dashboard after approval.
    </p>

    <div class="row">
      <button class="btn btn-pill-dark" @click="backToLogin">Back to Login</button>
    </div>
  </section>
</template>

<style scoped>
.auth-card {
  width: min(980px, 100%);
  margin: 0 auto;
  text-align: center;
}
.sub { color: #4b5563; margin: 10px 0 0; }
.row { display: flex; justify-content: center; margin-top: 16px; }
</style>
