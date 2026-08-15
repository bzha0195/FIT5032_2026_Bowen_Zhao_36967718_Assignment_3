<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppDataStore } from '@/stores/appData'
import { load, save } from '@/utils/storage'
import { hashPassword } from '@/utils/security'

const router = useRouter()
const auth = useAuthStore()
const data = useAppDataStore()

onMounted(() => data.hydrate())

const myBookings = computed(() => {
  if (!auth.user) return []
  return data.bookings.filter((b) => b.userId === auth.user.id)
})

const myApplications = computed(() => {
  if (!auth.user) return []
  return data.careApplications.filter((x) => x.userId === auth.user.id)
})

const myRatings = computed(() => {
  if (!auth.user) return []
  return data.ratings.filter((r) => r.userId === auth.user.id)
})

const myFavoriteArticles = computed(() => {
  if (!auth.user) return []
  const favIds = data.favorites
    .filter((f) => f.userId === auth.user.id)
    .map((f) => f.articleId)
  return data.articles.filter((a) => favIds.includes(a.id))
})

const readingOpen = ref(false)
const activeArticle = ref(null)

function openReading(article) {
  activeArticle.value = article
  readingOpen.value = true
}

function closeReading() {
  readingOpen.value = false
  activeArticle.value = null
}

function unbook(activityId) {
  if (!auth.user) return
  data.toggleBooking({ userId: auth.user.id, activityId })
}

function unfavorite(articleId) {
  if (!auth.user) return
  data.toggleFavorite(auth.user.id, articleId)
}

function removeRating(r) {
  if (!auth.user) return
  data.deleteRating({
    userId: auth.user.id,
    targetType: r.targetType,
    targetId: r.targetId,
  })
}

function cancelApplication(appId) {
  if (!auth.user) return
  data.cancelCareApplication(appId, auth.user.id)
}

function formatDateTime(v) {
  if (!v) return '-'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return String(v).replace('T', ' ').replace('Z', '')
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${hh}:${mm}`
}

function getActivityTitle(activityId) {
  return data.activities.find((a) => a.id === activityId)?.title || activityId
}

function getActivityTime(activityId) {
  return data.activities.find((a) => a.id === activityId)?.time || '-'
}

function getServiceName(serviceId) {
  return data.services.find((s) => s.id === serviceId)?.name || serviceId
}

function getArticleTitle(articleId) {
  return data.articles.find((a) => a.id === articleId)?.title || articleId
}

function getRatingTargetName(r) {
  if (r.targetType === 'activity') return getActivityTitle(r.targetId)
  if (r.targetType === 'service') return getServiceName(r.targetId)
  if (r.targetType === 'article') return getArticleTitle(r.targetId)
  return r.targetId
}

function getRatingComment(r) {
  const text = String(r.comment || '').trim()
  return text || 'No comment'
}

const editingProfile = ref(false)
const profileForm = reactive({
  name: '',
  phone: '',
  email: '',
})

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
  profileForm.name = auth.user?.name || ''
  profileForm.phone = auth.user?.phone || ''
  profileForm.email = auth.user?.email || ''
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
    email,
  }
  save('silver_users', users)

  auth.user = {
    ...auth.user,
    name,
    phone,
    email,
  }

  editingProfile.value = false
  alert('Profile saved')
}

const passwordOpen = ref(false)
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
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
    passwordHash: hashPassword(newPwd),
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

  closeDeleteModal()
  alert('Account deleted successfully.')
  router.push('/auth/login')
}
</script>

<template>
  <section>
    <h1>Personal Center</h1>

    <div class="card mt-16">
      <template v-if="!editingProfile">
        <p><strong>Name:</strong> {{ auth.user?.name || '-' }}</p>
        <p><strong>Phone:</strong> {{ auth.user?.phone || '-' }}</p>
        <p><strong>Email:</strong> {{ auth.user?.email || '-' }}</p>
        <div class="profile-actions">
          <button class="btn-secondary" @click="startEditProfile">Edit</button>
          <button class="btn-secondary" @click="openPasswordModal">Change Password</button>
          <button class="btn-danger" @click="openDeleteModal">Delete Account</button>
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
        <div class="profile-actions">
          <button class="btn-primary" @click="saveProfile">Save</button>
          <button class="btn-secondary" @click="cancelEditProfile">Cancel</button>
        </div>
      </template>
    </div>

    <div class="card mt-16">
      <h3>My Favorites</h3>
      <ul v-if="myFavoriteArticles.length">
        <li v-for="a in myFavoriteArticles" :key="a.id" class="fav-item">
          <div class="fav-main">
            <div class="fav-title">{{ a.title }}</div>
            <div class="fav-meta">{{ a.category }} | {{ a.publishedAt }}</div>
          </div>
          <div class="fav-actions">
            <button class="btn-secondary" @click="openReading(a)">Reading</button>
            <button class="btn-secondary" @click="unfavorite(a.id)">Unfavorite</button>
          </div>
        </li>
      </ul>
      <p v-else>No favorite articles yet.</p>
    </div>

    <div class="card mt-16">
      <h3>My Bookings</h3>
      <ul v-if="myBookings.length">
        <li v-for="b in myBookings" :key="b.id" class="booking-item">
          <span>{{ getActivityTitle(b.activityId) }} - {{ getActivityTime(b.activityId) }} - {{ b.status }}</span>
          <button class="btn-secondary" @click="unbook(b.activityId)">Unbook</button>
        </li>
      </ul>
      <p v-else>No booking records.</p>
    </div>

    <div class="card mt-16">
      <h3>My Care Applications</h3>
      <ul v-if="myApplications.length">
        <li v-for="a in myApplications" :key="a.id" class="app-item">
          <span>{{ getServiceName(a.serviceId) }} - {{ formatDateTime(a.visitTime) }} - {{ a.status }} - {{ formatDateTime(a.createdAt) }}</span>
          <button
            class="btn-secondary"
            @click="cancelApplication(a.id)"
            :disabled="a.status !== 'pending'"
            :title="a.status !== 'pending' ? 'Only pending applications can be canceled' : ''"
          >
            Cancel
          </button>
        </li>
      </ul>
      <p v-else>No application records.</p>
    </div>

    <div class="card mt-16">
      <h3>My Ratings</h3>
      <ul v-if="myRatings.length">
        <li v-for="r in myRatings" :key="r.id" class="rating-item">
          <div class="rating-main">
            <div class="rating-title">{{ r.targetType }} / {{ getRatingTargetName(r) }} - {{ r.stars }}★</div>
            <div class="rating-comment">{{ getRatingComment(r) }}</div>
          </div>
          <button class="btn-secondary" @click="removeRating(r)">Delete</button>
        </li>
      </ul>
      <p v-else>No rating records.</p>
    </div>

    <div v-if="readingOpen" class="reading-modal-mask" @click.self="closeReading">
      <div class="reading-modal card">
        <div class="reading-head">
          <h3>{{ activeArticle?.title }}</h3>
          <button class="btn-secondary" @click="closeReading">Close</button>
        </div>
        <p class="reading-meta">
          {{ activeArticle?.category }} | {{ activeArticle?.publishedAt }}
        </p>
        <p class="reading-summary">{{ activeArticle?.summary }}</p>
        <div class="reading-content">{{ activeArticle?.content }}</div>
      </div>
    </div>

    <div v-if="passwordOpen" class="reading-modal-mask" @click.self="closePasswordModal">
      <div class="reading-modal card">
        <div class="reading-head">
          <h3>Change Password</h3>
          <button class="btn-secondary" @click="closePasswordModal">Close</button>
        </div>

        <div class="form-grid mt-16">
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

        <div class="profile-actions">
          <button class="btn-primary" @click="changePassword">Confirm</button>
          <button class="btn-secondary" @click="closePasswordModal">Cancel</button>
        </div>
      </div>
    </div>

    <div v-if="deleteOpen" class="reading-modal-mask" @click.self="closeDeleteModal">
      <div class="reading-modal card">
        <div class="reading-head">
          <h3>Delete Account</h3>
          <button class="btn-secondary" @click="closeDeleteModal">Close</button>
        </div>
        <p class="reading-summary">Are you sure you want to delete this account?</p>
        <div class="profile-actions">
          <button class="btn-danger" @click="confirmDeleteAccount">Confirm</button>
          <button class="btn-secondary" @click="closeDeleteModal">Cancel</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.form-grid {
  display: grid;
  gap: 12px;
}

.form-grid label {
  display: grid;
  gap: 6px;
}

.profile-actions {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.fav-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 10px 0;
}

.fav-main {
  min-width: 0;
}

.fav-title {
  font-weight: 700;
}

.fav-meta {
  color: #4b5563;
  margin-top: 4px;
}

.fav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.booking-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 8px 0;
}

.app-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 8px 0;
}

.rating-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 8px 0;
}

.rating-main {
  min-width: 0;
}

.rating-title {
  font-weight: 600;
}

.rating-comment {
  color: #4b5563;
  margin-top: 4px;
  white-space: pre-line;
}

.reading-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.42);
  display: grid;
  place-items: center;
  z-index: 999;
  padding: 16px;
}

.reading-modal {
  width: min(760px, 96vw);
  max-height: 82vh;
  overflow: auto;
  background: #fff;
}

.reading-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.reading-meta {
  color: #4b5563;
  margin-top: 8px;
}

.reading-summary {
  margin-top: 10px;
  font-weight: 600;
}

.reading-content {
  margin-top: 12px;
  line-height: 1.7;
  white-space: pre-line;
}

.btn-danger {
  border: 1px solid #ef4444;
  background: #ef4444;
  color: #fff;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
}
</style>
