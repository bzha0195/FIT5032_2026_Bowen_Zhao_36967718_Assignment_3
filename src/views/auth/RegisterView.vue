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
        <label class="form-label">Name</label>
        <input class="form-control" v-model="form.name" placeholder="Enter Your Name" />
        <p v-if="err.name" class="error-text">{{ err.name }}</p>
      </div>

      <div class="form-item">
        <label class="form-label">Age</label>
        <input class="form-control" type="number" v-model="form.age" placeholder="Enter Your Age" />
        <p v-if="err.age" class="error-text">{{ err.age }}</p>
      </div>

      <div class="form-item">
        <label class="form-label">Phone</label>
        <input class="form-control" v-model="form.phone" placeholder="Enter Phone Number" />
        <p v-if="err.phone" class="error-text">{{ err.phone }}</p>
      </div>

      <div class="form-item">
        <label class="form-label">Email</label>
        <input class="form-control" v-model="form.email" placeholder="Enter Email Address" />
        <p v-if="err.email" class="error-text">{{ err.email }}</p>
      </div>

      <div class="form-item">
        <label class="form-label">Password</label>
        <input class="form-control" type="password" v-model="form.password" placeholder="Enter Password" />
        <p v-if="err.password" class="error-text">{{ err.password }}</p>
      </div>

      <div class="form-item">
        <label class="form-label">Confirm Password</label>
        <input class="form-control" type="password" v-model="form.confirm" placeholder="Confirm Password" />
        <p v-if="err.confirm" class="error-text">{{ err.confirm }}</p>
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
      <p v-if="err.role" class="error-text">{{ err.role }}</p>
    </div>

    <p v-if="err.common" class="error-text">{{ err.common }}</p>

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
