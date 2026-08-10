<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { required } from '@/utils/validators'

const router = useRouter()
const auth = useAuthStore()

const form = reactive({
  name: '',
  account: '',
  password: '',
  confirm: ''
})

const err = reactive({
  name: '',
  account: '',
  password: '',
  confirm: '',
  common: ''
})

function accountRule(value) {
  const v = String(value || '').trim()
  const isPhone = /^1\d{10}$/.test(v)
  const isEmail = v.includes('@')
  if (!isPhone && !isEmail) return 'Account must be a phone number (start with 1 and be 11 digits) or an email.'
  return ''
}

function passwordRule(value) {
  const v = String(value || '')
  if (v.length < 6) return 'Password must be at least 6 characters.'
  return ''
}

function confirmRule(pwd, confirm) {
  if (String(pwd) !== String(confirm)) return 'The two passwords do not match.'
  return ''
}

function validate() {
  err.name = required(form.name, 'Name')
  err.account = required(form.account, 'Account') || accountRule(form.account)
  err.password = required(form.password, 'New password') || passwordRule(form.password)
  err.confirm = required(form.confirm, 'Confirm password') || confirmRule(form.password, form.confirm)
  return !err.name && !err.account && !err.password && !err.confirm
}

async function submit() {
  err.common = ''
  if (!validate()) return

  const res = await auth.resetPassword({
    name: form.name,
    account: form.account,
    newPassword: form.password
  })

  if (!res.ok) {
    err.common = res.message || 'Reset password failed.'
    return
  }

  alert('Password reset successful. Please login with your new password.')
  router.push('/auth/login')
}
</script>

<template>
  <section class="register-page">
    <div class="register-card">
      <h2 class="title">Forgot Password</h2>

      <div class="form-item">
        <label class="form-label">Name</label>
        <input class="form-control thick" v-model="form.name" placeholder="Enter Your Name" />
        <p v-if="err.name" class="error-text">{{ err.name }}</p>
      </div>

      <div class="form-item">
        <label class="form-label">Account (Phone or Email)</label>
        <input class="form-control thick" v-model="form.account" placeholder="Enter Phone or Email" />
        <p v-if="err.account" class="error-text">{{ err.account }}</p>
      </div>

      <div class="form-item">
        <label class="form-label">New Password</label>
        <input class="form-control thick" type="password" v-model="form.password" placeholder="Enter New Password" />
        <p v-if="err.password" class="error-text">{{ err.password }}</p>
      </div>

      <div class="form-item">
        <label class="form-label">Confirm Password</label>
        <input class="form-control thick" type="password" v-model="form.confirm" placeholder="Confirm New Password" />
        <p v-if="err.confirm" class="error-text">{{ err.confirm }}</p>
      </div>

      <div class="bottom-actions">
        <button type="button" class="sub-btn primary" @click="submit">Reset Password</button>
        <router-link class="sub-btn" to="/auth/login">Back to Login</router-link>
      </div>

      <p v-if="err.common" class="error-text">{{ err.common }}</p>
    </div>
  </section>
</template>

<style scoped>
.register-page {
  width: min(62rem, 94%);
  margin: 1.25rem auto;
  padding: 0;
  background: transparent;
  border: 0;
}

.register-card {
  width: min(42rem, 100%);
  margin: 0 auto;
  border: 0.125rem solid #6b7280;
  border-radius: 0.75rem;
  background: #fff;
  padding: 1rem 0.875rem 0.875rem;
}

.title {
  font-size: 1.5em;
  margin: 0 0 0.875rem;
  color: #1f2937;
  font-weight: 800;
}

.form-item {
  margin-bottom: 0.625rem;
}

.form-label {
  display: block;
  font-size: 1.08em;
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

.bottom-actions {
  display: flex;
  width: 100%;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.bottom-actions > .sub-btn {
  flex: 1 1 0;
  width: 0;
  min-width: 0;
  box-sizing: border-box;
  height: 2.7em;
  min-height: 2.7em;
  border-radius: 999rem;
  border: 1px solid transparent;
  background: #cfd5e0;
  color: #1f2937;
  font-size: 1.12em;
  font-weight: 700;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  white-space: nowrap;
  padding: 0 0.875rem;
  margin: 0;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
}

.bottom-actions > .sub-btn.primary {
  background: #434a56;
  color: #fff;
}

.error-text {
  color: #b91c1c;
  margin: 0.375rem 0 0;
  font-size: 0.875em;
  line-height: 1.3;
}

@media (max-width: 48rem) {
  .register-card {
    width: 100%;
    padding: 0.875rem 0.75rem;
  }
}
</style>
