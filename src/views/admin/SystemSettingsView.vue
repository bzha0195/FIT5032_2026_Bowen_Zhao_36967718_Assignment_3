<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { load, save } from '@/utils/storage'
import { hashPassword } from '@/utils/security'

const router = useRouter()
const auth = useAuthStore()

const editingProfile = ref(false)
const profileForm = reactive({
  name: '',
  phone: '',
  email: ''
})

const canEdit = computed(() => !!auth.user)

watch(
  () => auth.user,
  (u) => {
    profileForm.name = u?.name || ''
    profileForm.phone = u?.phone || ''
    profileForm.email = u?.email || ''
  },
  { immediate: true }
)

function startEditProfile() {
  if (!auth.user) return
  profileForm.name = auth.user.name || ''
  profileForm.phone = auth.user.phone || ''
  profileForm.email = auth.user.email || ''
  editingProfile.value = true
}

function cancelEditProfile() {
  profileForm.name = auth.user?.name || ''
  profileForm.phone = auth.user?.phone || ''
  profileForm.email = auth.user?.email || ''
  editingProfile.value = false
}

function saveProfile() {
  if (!auth.user) return

  const name = String(profileForm.name || '').trim()
  const phone = String(profileForm.phone || '').trim()
  const email = String(profileForm.email || '').trim()

  if (!name) {
    alert('Name is required')
    return
  }
  if (!phone) {
    alert('Phone is required')
    return
  }
  if (!email) {
    alert('Email is required')
    return
  }
  if (!/^1\d{10}$/.test(phone)) {
    alert('Phone must start with 1 and be 11 digits.')
    return
  }
  if (!email.includes('@')) {
    alert('Email must contain @.')
    return
  }

  const users = load('silver_users', [])
  const idx = users.findIndex((u) => u.id === auth.user.id)
  if (idx < 0) {
    alert('User not found')
    return
  }

  const phoneExists = users.some((u, i) => i !== idx && String(u.phone || '').trim() === phone)
  if (phoneExists) {
    alert('Phone already registered')
    return
  }

  const emailNorm = email.toLowerCase()
  const emailExists = users.some((u, i) => i !== idx && String(u.email || '').trim().toLowerCase() === emailNorm)
  if (emailExists) {
    alert('Email already registered')
    return
  }

  users[idx] = {
    ...users[idx],
    name,
    phone,
    email
  }
  save('silver_users', users)

  auth.user = {
    ...auth.user,
    name,
    phone,
    email
  }

  if (Array.isArray(auth.sessions) && auth.activeSessionId) {
    auth.persistSessions?.()
  }

  editingProfile.value = false
  alert('Profile saved')
}

const passwordOpen = ref(false)
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

function openPasswordModal() {
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordOpen.value = true
}

function closePasswordModal() {
  passwordOpen.value = false
}

function changePassword() {
  if (!auth.user) return

  const oldPwd = String(passwordForm.oldPassword || '')
  const newPwd = String(passwordForm.newPassword || '')
  const confirmPwd = String(passwordForm.confirmPassword || '')

  if (!oldPwd) {
    alert('Current password is required.')
    return
  }
  if (!newPwd) {
    alert('New password is required.')
    return
  }
  if (newPwd.length < 6) {
    alert('New password must be at least 6 characters.')
    return
  }
  if (!confirmPwd) {
    alert('Confirm password is required.')
    return
  }
  if (newPwd !== confirmPwd) {
    alert('New password and confirm password do not match.')
    return
  }

  const users = load('silver_users', [])
  const idx = users.findIndex((u) => u.id === auth.user.id)
  if (idx < 0) {
    alert('User not found')
    return
  }

  const oldHash = hashPassword(oldPwd)
  if (users[idx].passwordHash !== oldHash) {
    alert('Current password is incorrect.')
    return
  }

  users[idx] = {
    ...users[idx],
    passwordHash: hashPassword(newPwd)
  }
  save('silver_users', users)

  closePasswordModal()
  alert('Password changed successfully.')
}

const deleteOpen = ref(false)

function openDeleteModal() {
  deleteOpen.value = true
}

function closeDeleteModal() {
  deleteOpen.value = false
}

function confirmDeleteAccount() {
  if (!auth.user) return

  const users = load('silver_users', [])
  const nextUsers = users.filter((u) => u.id !== auth.user.id)
  save('silver_users', nextUsers)

  auth.user = null
  save('silver_session', null)

  if (Array.isArray(auth.sessions) && auth.activeSessionId) {
    auth.sessions = auth.sessions.filter((s) => s.userId !== undefined ? s.userId !== auth.user?.id : true)
    auth.persistSessions?.()
  }

  closeDeleteModal()
  alert('Account deleted successfully.')
  router.push('/auth/login')
}
</script>

<template>
  <section class="wire card settings-wrap">
    <h2>System Settings</h2>

    <div class="profile-card">
      <template v-if="!editingProfile">
        <p><strong>Name:</strong> {{ auth.user?.name || '-' }}</p>
        <p><strong>Phone:</strong> {{ auth.user?.phone || '-' }}</p>
        <p><strong>Email:</strong> {{ auth.user?.email || '-' }}</p>

        <div class="btn-row">
          <button class="btn btn-pill-dark" :disabled="!canEdit" @click="startEditProfile">Edit</button>
          <button class="btn btn-pill-dark" :disabled="!canEdit" @click="openPasswordModal">Change Password</button>
          <button class="btn btn-danger" :disabled="!canEdit" @click="openDeleteModal">Delete Account</button>
        </div>
      </template>

      <template v-else>
        <div class="form-grid">
          <label>
            <span>Name</span>
            <input class="form-control" v-model="profileForm.name" />
          </label>

          <label>
            <span>Phone</span>
            <input class="form-control" v-model="profileForm.phone" />
          </label>

          <label>
            <span>Email</span>
            <input class="form-control" v-model="profileForm.email" />
          </label>
        </div>

        <div class="btn-row">
          <button class="btn btn-pill-dark" @click="saveProfile">Save</button>
          <button class="btn btn-pill-light" @click="cancelEditProfile">Cancel</button>
        </div>
      </template>
    </div>

    <div v-if="passwordOpen" class="modal-mask" @click.self="closePasswordModal">
      <div class="modal-card">
        <div class="modal-head">
          <h3>Change Password</h3>
          <button class="btn btn-pill-light" @click="closePasswordModal">Close</button>
        </div>
        <div class="form-grid">
          <label>
            <span>Current Password</span>
            <input class="form-control" type="password" v-model="passwordForm.oldPassword" />
          </label>
          <label>
            <span>New Password</span>
            <input class="form-control" type="password" v-model="passwordForm.newPassword" />
          </label>
          <label>
            <span>Confirm Password</span>
            <input class="form-control" type="password" v-model="passwordForm.confirmPassword" />
          </label>
        </div>
        <div class="btn-row">
          <button class="btn btn-pill-dark" @click="changePassword">Confirm</button>
          <button class="btn btn-pill-light" @click="closePasswordModal">Cancel</button>
        </div>
      </div>
    </div>

    <div v-if="deleteOpen" class="modal-mask" @click.self="closeDeleteModal">
      <div class="modal-card">
        <div class="modal-head">
          <h3>Delete Account</h3>
          <button class="btn btn-pill-light" @click="closeDeleteModal">Close</button>
        </div>
        <p class="confirm-text">Are you sure you want to delete this account?</p>
        <div class="btn-row">
          <button class="btn btn-danger" @click="confirmDeleteAccount">Confirm</button>
          <button class="btn btn-pill-light" @click="closeDeleteModal">Cancel</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.settings-wrap {
  max-width: 980px;
}

.profile-card {
  border: 1px solid #d1d5db;
  border-radius: 12px;
  padding: 16px;
  background: #fff;
  margin-top: 12px;
}

.profile-card p {
  margin: 8px 0;
  font-size: 16px;
}

.form-grid {
  display: grid;
  gap: 12px;
}

.form-grid label {
  display: grid;
  gap: 6px;
}

.form-grid span {
  font-weight: 600;
  color: #111827;
}

.btn-row {
  margin-top: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.btn-danger {
  border: 1px solid #ef4444;
  background: #ef4444;
  color: #fff;
  border-radius: 999px;
  padding: 8px 14px;
  cursor: pointer;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.42);
  display: grid;
  place-items: center;
  z-index: 999;
  padding: 16px;
}

.modal-card {
  width: min(620px, 96vw);
  border: 1px solid #d1d5db;
  border-radius: 12px;
  padding: 16px;
  background: #fff;
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.confirm-text {
  margin-top: 8px;
  color: #111827;
}
</style>
