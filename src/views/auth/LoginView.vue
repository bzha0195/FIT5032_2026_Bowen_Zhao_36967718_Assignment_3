<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppDataStore } from '@/stores/appData'
import { required } from '@/utils/validators'

const router = useRouter()
const auth = useAuthStore()
const appData = useAppDataStore()

const form = reactive({
  account: '',
  password: '',
  role: ''
})

const errors = reactive({
  account: '',
  password: '',
  role: '',
  common: ''
})

function validate() {
  errors.account = required(form.account, 'Account number')
  errors.password = required(form.password, 'Password')
  errors.role = form.role ? '' : 'Please choose your role'
  return !errors.account && !errors.password && !errors.role
}

async function submit() {
  errors.common = ''
  if (!validate()) return

  const res = await auth.login({ account: form.account, password: form.password })
  if (!res.ok) {
    errors.common = res.message || 'Login failed'
    return
  }

  const realRole = auth.user?.role
  appData.setFirestoreUser(auth.user)
  appData.migrateLegacyUserData(res.legacyId, auth.user?.id)

  if (form.role === 'admin' && !(realRole === 'admin' || realRole === 'admin-pending')) {
    errors.common = 'This account is not an administrator account'
    auth.logout()
    return
  }

  if (form.role === 'user' && realRole !== 'user') {
    errors.common = 'This account is not an elderly user account'
    auth.logout()
    return
  }

  if (realRole === 'admin') {
    router.push('/admin')
    return
  }

  if (realRole === 'admin-pending') {
    router.push('/auth/admin-pending')
    return
  }

  router.push('/')
}

async function submitFirebase() {
  errors.common = ''
  errors.account = required(form.account, 'Account number')
  errors.password = required(form.password, 'Password')
  if (errors.account || errors.password) return

  const account = String(form.account || '').trim()
  if (!account.includes('@')) {
    errors.common = 'Firebase login requires email account'
    return
  }

  const res = await auth.loginWithFirebase({ email: account, password: form.password })
  if (!res.ok) {
    errors.common = res.message || 'Firebase login failed'
    return
  }

  const realRole = auth.user?.role
  appData.setFirestoreUser(auth.user)
  appData.migrateLegacyUserData(res.legacyId, auth.user?.id)

  if (form.role === 'admin' && !(realRole === 'admin' || realRole === 'admin-pending')) {
    errors.common = 'This account is not an administrator account'
    auth.logout()
    return
  }

  if (form.role === 'user' && realRole !== 'user') {
    errors.common = 'This account is not an elderly user account'
    auth.logout()
    return
  }

  if (realRole === 'admin') {
    router.push('/admin')
    return
  }

  if (realRole === 'admin-pending') {
    router.push('/auth/admin-pending')
    return
  }

  router.push('/')
}
</script>

<template>
  <section class="login-page">
    <div class="login-card">
      <div class="form-item">
        <label class="form-label" for="login-account">Account Number</label>
        <input id="login-account" class="form-control thick" v-model="form.account" autocomplete="username" placeholder="Enter Account Number" :aria-invalid="!!errors.account" aria-describedby="login-account-error" />
        <p v-if="errors.account" id="login-account-error" class="error-text" role="alert">{{ errors.account }}</p>
      </div>

      <div class="form-item">
        <label class="form-label" for="login-password">Password</label>
        <input id="login-password" class="form-control thick" type="password" v-model="form.password" autocomplete="current-password" placeholder="Enter Password" :aria-invalid="!!errors.password" aria-describedby="login-password-error" />
        <p v-if="errors.password" id="login-password-error" class="error-text" role="alert">{{ errors.password }}</p>
      </div>

      <div class="form-item">
        <p id="login-role-label" class="form-label">Choose Your Role</p>
        <div class="role-row" role="radiogroup" aria-labelledby="login-role-label">
          <button type="button" role="radio" :aria-checked="form.role === 'user'" class="role-btn" :class="{ active: form.role === 'user' }" @click="form.role = 'user'">
            Elderly User
          </button>
          <button type="button" role="radio" :aria-checked="form.role === 'admin'" class="role-btn" :class="{ active: form.role === 'admin' }" @click="form.role = 'admin'">
            Administrator
          </button>
        </div>
        <p v-if="errors.role" class="error-text" role="alert">{{ errors.role }}</p>
      </div>

      <button type="button" class="login-btn" @click="submit">Login</button>
      <button type="button" class="login-btn firebase-btn" @click="submitFirebase">Login with Firebase</button>

      <div class="bottom-row">
        <router-link class="half-btn link-btn" to="/auth/forgot-password">Forgot Password</router-link>
        <router-link class="half-btn link-btn" to="/auth/register">Create New Account</router-link>
      </div>

      <p v-if="errors.common" class="error-text" role="alert">{{ errors.common }}</p>
    </div>
  </section>
</template>

<style scoped>
.login-page {
  width: min(62rem, 94%);
  margin: 1.25rem auto;
  padding: 0;
  background: transparent;
  border: 0;
}

.login-card {
  width: min(42rem, 100%);
  margin: 0 auto;
  border: 0.125rem solid #6b7280;
  border-radius: 0.75rem;
  background: #fff;
  padding: 1rem 0.875rem 0.875rem;
}

.form-item {
  margin-bottom: 0.625rem;
}

.form-label {
  display: block;
  font-size: 1.2em;
  font-weight: 700;
  line-height: 1.2;
  color: #1f2937;
  margin-bottom: 0.375rem;
}

.form-control.thick {
  width: 100%;
  height: 2.6em;
  border: 0.125rem solid #6b7280;
  border-radius: 0.625rem;
  font-size: 1em;
  padding: 0 0.75em;
  box-sizing: border-box;
}

.role-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.role-btn {
  height: 2.55em;
  border-radius: 999rem;
  border: none;
  background: #cfd5df;
  color: #111827;
  font-size: 1.08em;
  font-weight: 700;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 0.7em;
  cursor: pointer;
}

.role-btn.active {
  background: #434a56;
  color: #fff;
}

.login-btn {
  width: 100%;
  height: 2.7em;
  margin-top: 0.5rem;
  border-radius: 999rem;
  border: none;
  background: #434a56;
  color: #fff;
  font-size: 1.18em;
  font-weight: 700;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.firebase-btn {
  background: #2563eb;
}

.bottom-row {
  margin-top: 0.5rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.half-btn,
.link-btn {
  height: 2.55em;
  border-radius: 999rem;
  border: none;
  background: #cfd5df;
  color: #111827;
  font-size: 1.02em;
  font-weight: 700;
  line-height: 1.05;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  text-decoration: none;
  padding: 0 0.7em;
  box-sizing: border-box;
  cursor: pointer;
}

.error-text {
  color: #b91c1c;
  margin: 0.375rem 0 0;
  font-size: 0.875em;
  line-height: 1.3;
}

@media (max-width: 48rem) {
  .login-card {
    width: 100%;
    padding: 0.875rem 0.75rem;
  }
}
</style>
