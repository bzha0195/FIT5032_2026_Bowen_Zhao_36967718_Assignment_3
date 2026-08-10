<script setup>
import { computed, reactive } from 'vue'
import { useAppDataStore } from '@/stores/appData'
import { load } from '@/utils/storage'

const USERS_KEY = 'silver_users'

const appData = useAppDataStore()
if (!appData.hydrated) appData.hydrate()

const form = reactive({
  name: '',
  type: '',
  description: ''
})

const services = computed(() => appData.services || [])

function formatDateTime(v) {
  if (!v) return '-'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) {
    const s = String(v).trim()
    return s.length >= 16 ? s.slice(0, 16) : s
  }
  const pad = (n) => String(n).padStart(2, '0')
  const y = d.getFullYear()
  const m = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const h = pad(d.getHours())
  const min = pad(d.getMinutes())
  return `${y}-${m}-${day} ${h}:${min}`
}

const serviceSignupRows = computed(() => {
  const users = load(USERS_KEY, [])
  const userMap = new Map((users || []).map(u => [u.id, u]))
  const serviceMap = new Map((appData.services || []).map(s => [s.id, s]))

  return (appData.careApplications || []).map(c => {
    const u = userMap.get(c.userId) || {}
    const s = serviceMap.get(c.serviceId) || {}

    const projectName = s.name || c.serviceName || c.projectName || '-'
    const timeRaw = c.visitTime || c.createdAt || ''
    const address = c.address || '-'
    const additionalNote = c.note || '-'

    return {
      id: c.id,
      name: u.name || c.name || '-',
      phone: u.phone || c.phone || '-',
      email: u.email || '-',
      projectName,
      time: formatDateTime(timeRaw),
      address,
      additionalNote
    }
  })
})

function createService() {
  const name = form.name.trim()
  const type = form.type.trim()
  const description = form.description.trim()

  if (!name || !type || !description) {
    alert('Please fill in all fields.')
    return
  }

  if (typeof appData.addService === 'function') {
    appData.addService({ name, type, description })
  } else {
    appData.services.unshift({
      id: crypto.randomUUID(),
      name,
      type,
      description
    })
  }

  if (typeof appData.persist === 'function') appData.persist()

  form.name = ''
  form.type = ''
  form.description = ''
  alert('Service created successfully.')
}

function removeService(id) {
  if (!confirm('Delete this service?')) return

  if (typeof appData.deleteService === 'function') {
    appData.deleteService(id)
  } else if (typeof appData.removeService === 'function') {
    appData.removeService(id)
  } else {
    appData.services = appData.services.filter((s) => s.id !== id)
  }

  if (typeof appData.persist === 'function') appData.persist()

  alert('Service deleted successfully.')
}
</script>

<template>
  <section class="wire card">
    <h2>Service Management</h2>

    <div class="grid-2">
      <div class="block">
        <h4>Create Service</h4>

        <div class="form-item">
          <label class="form-label">Name</label>
          <input class="form-control" v-model="form.name" />
        </div>

        <div class="form-item">
          <label class="form-label">Type</label>
          <input class="form-control" v-model="form.type" />
        </div>

        <div class="form-item">
          <label class="form-label">Description</label>
          <textarea class="form-control" rows="4" v-model="form.description"></textarea>
        </div>

        <button class="btn btn-pill-dark" @click="createService">Create</button>
      </div>

      <div class="block">
        <h4>Service List</h4>
        <p class="meta">Total: {{ services.length }}</p>
        <ul class="list">
          <li v-for="s in services" :key="s.id">
            <span class="title">{{ s.name }}</span>
            <button class="btn btn-pill-light" @click="removeService(s.id)">Delete</button>
          </li>
        </ul>
      </div>
    </div>

    <div class="block signup-block">
      <h4>Service Signups</h4>
      <p class="meta">Total: {{ serviceSignupRows.length }}</p>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Activity Name</th>
              <th>Time</th>
              <th>Address</th>
              <th>Additional Note</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in serviceSignupRows" :key="row.id">
              <td>{{ row.name }}</td>
              <td>{{ row.phone }}</td>
              <td>{{ row.email }}</td>
              <td>{{ row.projectName }}</td>
              <td>{{ row.time }}</td>
              <td>{{ row.address }}</td>
              <td>{{ row.additionalNote }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<style scoped>
.block { border:1px solid #d1d5db; border-radius:10px; padding:12px; background:#fff; }
.meta { margin: 0 0 8px; color:#6b7280; }
.list { list-style:none; margin:0; padding:0; }
.list li { display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e5e7eb; padding:10px 0; gap:12px; }
.list li:last-child { border-bottom:none; }
.title { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.signup-block { margin-top: 12px; }
.table-wrap { overflow:auto; }
.table { width:100%; border-collapse:collapse; }
.table th, .table td { border:1px solid #e5e7eb; padding:8px; text-align:left; white-space: nowrap; }
.table th { background:#f8fafc; }
</style>
