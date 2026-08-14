<script setup>
import { reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { required } from '@/utils/validators'

const router = useRouter()
const auth = useAuthStore()

const form = reactive({
  name: '',
  age: '',
  phone: '',
  email: '',
  password: '',
  confirm: '',
  role: 'user'
})

const err = reactive({
  name: '',
  age: '',
  phone: '',
  email: '',
  password: '',
  confirm: '',
  role: '',
  common: ''
})

const ageHint = computed(() => {
  return form.role === 'admin-pending'
    ? 'Administrator age must be between 20 and 60.'
    : 'Elderly user age must be between 60 and 100.'
})

function phoneRule(value) {
  if (!/^1\d{10}$/.test(String(value || '').trim())) return 'Phone must start with 1 and be 11 digits.'
  return ''
}

function emailRule(value) {
  const v = String(value || '').trim()
  if (!v.includes('@')) return 'Email must contain @.'
  return ''
}

function passwordRule(value) {
  const v = String(value || '')
  if (v.length < 6) return 'Password must be at least 6 characters.'
  return ''
}

function ageByRoleRule(value, role) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 'Age is required.'
  if (role === 'admin-pending') {
    if (n < 20 || n > 60) return 'Administrator age must be between 20 and 60.'
  } else {
    if (n < 60 || n > 100) return 'Elderly user age must be between 60 and 100.'
  }
  return ''
}

function validate() {
  err.name = required(form.name, 'Name')
  err.age = required(form.age, 'Age') || ageByRoleRule(form.age, form.role)
  err.phone = required(form.phone, 'Phone') || phoneRule(form.phone)
  err.email = required(form.email, 'Email') || emailRule(form.email)
  err.password = required(form.password, 'Password') || passwordRule(form.password)
  err.confirm = required(form.confirm, 'Confirm Password') || (form.confirm !== form.password ? 'Passwords do not match.' : '')
  err.role = required(form.role, 'Account Type')
  return !err.name && !err.age && !err.phone && !err.email && !err.password && !err.confirm && !err.role
}

async function submit() {
  err.common = ''
  if (!validate()) return

  const res = await auth.register({
    name: form.name,
    age: form.age,
    phone: form.phone,
    email: form.email,
    password: form.password,
    role: form.role
  })

  if (!res.ok) {
    err.common = res.message || 'Registration failed.'
    return
  }

  router.push('/auth/login')
}
</script>

<template>
  <section class="wire card auth-card">
    <h2>Create New Account</h2>

    <div class="grid-2">
      <div class="form-item">
        <label class="form-label" for="register-name">Name</label>
        <input id="register-name" class="form-control" v-model="form.name" autocomplete="name" placeholder="Enter Your Name" :aria-invalid="!!err.name" aria-describedby="register-name-error" />
        <p v-if="err.name" id="register-name-error" class="error-text" role="alert">{{ err.name }}</p>
      </div>

      <div class="form-item">
        <label class="form-label" for="register-age">Age</label>
        <input id="register-age" class="form-control" type="number" v-model="form.age" placeholder="Enter Your Age" :aria-invalid="!!err.age" aria-describedby="register-age-error" />
        <p v-if="err.age" id="register-age-error" class="error-text" role="alert">{{ err.age }}</p>
      </div>

      <div class="form-item">
        <label class="form-label" for="register-phone">Phone</label>
        <input id="register-phone" class="form-control" v-model="form.phone" autocomplete="tel" placeholder="Enter Phone Number" :aria-invalid="!!err.phone" aria-describedby="register-phone-error" />
        <p v-if="err.phone" id="register-phone-error" class="error-text" role="alert">{{ err.phone }}</p>
      </div>

      <div class="form-item">
        <label class="form-label" for="register-email">Email</label>
        <input id="register-email" class="form-control" v-model="form.email" autocomplete="email" placeholder="Enter Email Address" :aria-invalid="!!err.email" aria-describedby="register-email-error" />
        <p v-if="err.email" id="register-email-error" class="error-text" role="alert">{{ err.email }}</p>
      </div>

      <div class="form-item">
        <label class="form-label" for="register-password">Password</label>
        <input id="register-password" class="form-control" type="password" v-model="form.password" autocomplete="new-password" placeholder="Enter Password" :aria-invalid="!!err.password" aria-describedby="register-password-error" />
        <p v-if="err.password" id="register-password-error" class="error-text" role="alert">{{ err.password }}</p>
      </div>

      <div class="form-item">
        <label class="form-label" for="register-confirm">Confirm Password</label>
        <input id="register-confirm" class="form-control" type="password" v-model="form.confirm" autocomplete="new-password" placeholder="Confirm Password" :aria-invalid="!!err.confirm" aria-describedby="register-confirm-error" />
        <p v-if="err.confirm" id="register-confirm-error" class="error-text" role="alert">{{ err.confirm }}</p>
      </div>
    </div>

    <div class="form-item role-wrap">
      <label class="form-label">Account Type</label>
      <div class="role-group">
        <label class="role-option">
          <input type="radio" value="user" v-model="form.role" />
          Elderly User
        </label>
        <label class="role-option">
          <input type="radio" value="admin-pending" v-model="form.role" />
          Administrator (Need Approval)
        </label>
      </div>
      <p class="hint">{{ ageHint }}</p>
      <p v-if="err.role" class="error-text" role="alert">{{ err.role }}</p>
    </div>

    <p v-if="err.common" class="error-text" role="alert">{{ err.common }}</p>

    <div class="bottom-actions">
      <button type="button" class="sub-btn primary" @click="submit">Register</button>
      <router-link class="sub-btn" to="/auth/login">Back to Login</router-link>
    </div>
  </section>
</template>

<style scoped>
.auth-card {
  width: min(980px, 100%);
  margin: 0 auto;
}

.form-item {
  margin-bottom: 10px;
}

.error-text {
  color: #b91c1c;
  margin: 6px 0 0;
}

.role-group {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.role-option {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.hint {
  color: #6b7280;
  margin: 6px 0 0;
}

.bottom-actions {
  display: flex;
  width: 100%;
  gap: 8px;
  align-items: center;
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

@media (max-width: 768px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
