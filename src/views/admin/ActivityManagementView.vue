<script setup>
import { computed, reactive } from 'vue'
import { useAppDataStore } from '@/stores/appData'
import { load } from '@/utils/storage'
import InteractiveDataTable from '@/components/admin/InteractiveDataTable.vue'
import { exportCsv } from '@/utils/exportCsv'

const USERS_KEY = 'silver_users'

const appData = useAppDataStore()
if (!appData.hydrated) appData.hydrate()

const form = reactive({
  title: '',
  type: '',
  date: '',
  clock: '',
  location: '',
  quota: '',
  description: ''
})

const activities = computed(() => appData.activities || [])

const signupColumns = [
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'activityTitle', label: 'Activity' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Booked at' }
]

const signupRows = computed(() => {
  const users = load(USERS_KEY, [])
  const userMap = new Map((users || []).map(u => [u.id, u]))
  const actMap = new Map((appData.activities || []).map(a => [a.id, a]))

  return (appData.bookings || []).map(b => {
    const u = userMap.get(b.userId) || {}
    const a = actMap.get(b.activityId) || {}
    return {
      id: b.id,
      name: u.name || '-',
      phone: u.phone || '-',
      email: u.email || '-',
      activityTitle: a.title || '-',
      status: b.status || '-',
      createdAt: b.createdAt ? new Date(b.createdAt).toLocaleString() : '-'
    }
  })
})

function createActivity() {
  const title = form.title.trim()
  const type = form.type.trim()
  const date = form.date
  const clock = form.clock
  const location = form.location.trim()
  const quota = Number(form.quota || 0)
  const description = form.description.trim()

  if (!title || !type || !date || !clock || !location) {
    alert('Please fill in Title, Type, Date, Time and Location.')
    return
  }

  const time = `${date} ${clock}`

  if (typeof appData.addActivity === 'function') {
    appData.addActivity({
      title,
      type,
      time,
      location,
      quota: Number.isFinite(quota) && quota > 0 ? quota : 0,
      booked: 0,
      description
    })
  } else {
    appData.activities.unshift({
      id: crypto.randomUUID(),
      title,
      type,
      time,
      location,
      quota: Number.isFinite(quota) && quota > 0 ? quota : 0,
      booked: 0,
      description
    })
  }

  if (typeof appData.persist === 'function') appData.persist()

  form.title = ''
  form.type = ''
  form.date = ''
  form.clock = ''
  form.location = ''
  form.quota = ''
  form.description = ''
}

function removeActivity(id) {
  if (!confirm('Delete this activity?')) return

  if (typeof appData.deleteActivity === 'function') {
    appData.deleteActivity(id)
  } else {
    appData.activities = appData.activities.filter((a) => a.id !== id)
  }

  if (typeof appData.persist === 'function') appData.persist()
}

function exportSignups() {
  exportCsv('activity-signups.csv', signupColumns, signupRows.value)
}
</script>

<template>
  <section class="wire card">
    <h2>Activity Management</h2>

    <div class="grid-2">
      <div class="block">
        <h4>Create Activity</h4>

        <div class="form-item">
          <label class="form-label">Title</label>
          <input class="form-control" v-model="form.title" />
        </div>

        <div class="form-item">
          <label class="form-label">Type</label>
          <input class="form-control" v-model="form.type" />
        </div>

        <div class="form-item">
          <label class="form-label">Date</label>
          <input class="form-control" type="date" v-model="form.date" />
        </div>

        <div class="form-item">
          <label class="form-label">Time</label>
          <input class="form-control" type="time" v-model="form.clock" />
        </div>

        <div class="form-item">
          <label class="form-label">Location</label>
          <input class="form-control" v-model="form.location" />
        </div>

        <div class="form-item">
          <label class="form-label">Quota</label>
          <input class="form-control" type="number" min="0" v-model="form.quota" />
        </div>

        <div class="form-item">
          <label class="form-label">Description</label>
          <textarea class="form-control" rows="4" v-model="form.description"></textarea>
        </div>

        <button class="btn btn-pill-dark" @click="createActivity">Create</button>
      </div>

      <div class="block">
        <h4>Activity List</h4>
        <p class="meta">Total: {{ activities.length }}</p>
        <ul class="list">
          <li v-for="a in activities" :key="a.id">
            <span class="title">{{ a.title }} ({{ a.time || '-' }})</span>
            <button class="btn btn-pill-light" @click="removeActivity(a.id)">Delete</button>
          </li>
        </ul>
      </div>
    </div>

    <div class="block signup-block">
      <div class="section-heading"><h4>Activity Signups</h4><button class="btn btn-pill-light" @click="exportSignups">Export CSV</button></div>
      <p class="meta">Search each column, click a heading to sort, and use pagination to view up to 10 records at a time.</p>
      <InteractiveDataTable :columns="signupColumns" :rows="signupRows" empty-message="No activity signups found." />
    </div>
  </section>
</template>

<style scoped>
.block { border:1px solid #d1d5db; border-radius:10px; padding:12px; background:#fff; }
.section-heading { display:flex; justify-content:space-between; align-items:center; gap:12px; }
.section-heading h4 { margin:0; }
.meta { margin:0 0 8px; color:#6b7280; }
.list { list-style:none; margin:0; padding:0; }
.list li {
  display:flex;
  justify-content:space-between;
  align-items:center;
  border-bottom:1px solid #e5e7eb;
  padding:10px 0;
  gap:12px;
}
.list li:last-child { border-bottom:none; }
.title {
  flex:1;
  min-width:0;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}

.signup-block { margin-top: 12px; }
</style>
