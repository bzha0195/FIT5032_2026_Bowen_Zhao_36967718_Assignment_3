<script setup>
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { load } from '@/utils/storage'

const USERS_KEY = 'silver_users'
const auth = useAuthStore()
const keyword = ref('')
const version = ref(0)

const users = computed(() => {
  version.value
  return load(USERS_KEY, [])
})

const pendingAdmins = computed(() => {
  return users.value.filter((u) => u.role === 'admin-pending')
})

function matchKeyword(u, kw) {
  const name = String(u.name || '').toLowerCase()
  const phone = String(u.phone || '').toLowerCase()
  const email = String(u.email || '').toLowerCase()
  return name.includes(kw) || phone.includes(kw) || email.includes(kw)
}

const adminUsers = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  const list = users.value.filter((u) => u.role === 'admin')
  if (!kw) return list
  return list.filter((u) => matchKeyword(u, kw))
})

const regularUsers = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  const list = users.value.filter((u) => u.role === 'user')
  if (!kw) return list
  return list.filter((u) => matchKeyword(u, kw))
})

function refresh() {
  version.value++
}

function approve(id) {
  const res = auth.approveAdmin(id)
  alert(res.message || (res.ok ? 'Approved' : 'Failed'))
  refresh()
}

function reject(id) {
  const res = auth.rejectAdmin(id)
  alert(res.message || (res.ok ? 'Done' : 'Failed'))
  refresh()
}
</script>

<template>
  <section class="wire card">
    <h2>User Management</h2>

    <div class="block">
      <h4>Pending Admin Approvals</h4>
      <div class="table-like">
        <div class="row row-pending head">
          <span>Name</span><span>Age</span><span>Phone</span><span>Email</span><span>Action</span>
        </div>
        <div class="row row-pending" v-for="u in pendingAdmins" :key="u.id">
          <span>{{ u.name }}</span>
          <span>{{ u.age }}</span>
          <span>{{ u.phone }}</span>
          <span>{{ u.email }}</span>
          <span class="acts">
            <button class="btn btn-pill-dark" @click="approve(u.id)">Approve</button>
            <button class="btn btn-pill-light" @click="reject(u.id)">Reject</button>
          </span>
        </div>
      </div>
    </div>

    <div class="block">
      <h4>All Registered Users</h4>
      <div class="toolbar">
        <input class="form-control" v-model="keyword" placeholder="Search by name / phone / email..." />
      </div>

      <h4 class="sub-title">Administrators</h4>
      <div class="table-like">
        <div class="row row-user head">
          <span>Name</span><span>Role</span><span>Age</span><span>Phone</span><span>Email</span>
        </div>
        <div class="row row-user" v-for="u in adminUsers" :key="u.id">
          <span>{{ u.name }}</span>
          <span>{{ u.role }}</span>
          <span>{{ u.age }}</span>
          <span>{{ u.phone }}</span>
          <span>{{ u.email }}</span>
        </div>
        <div class="row row-user" v-if="adminUsers.length === 0">
          <span>No administrator records</span><span></span><span></span><span></span><span></span>
        </div>
      </div>

      <h4 class="sub-title mt-12">Users</h4>
      <div class="table-like">
        <div class="row row-user head">
          <span>Name</span><span>Role</span><span>Age</span><span>Phone</span><span>Email</span>
        </div>
        <div class="row row-user" v-for="u in regularUsers" :key="u.id">
          <span>{{ u.name }}</span>
          <span>{{ u.role }}</span>
          <span>{{ u.age }}</span>
          <span>{{ u.phone }}</span>
          <span>{{ u.email }}</span>
        </div>
        <div class="row row-user" v-if="regularUsers.length === 0">
          <span>No user records</span><span></span><span></span><span></span><span></span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.wire { display: grid; gap: 14px; }
.block { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
.toolbar { display: flex; gap: 8px; margin-bottom: 10px; }
.form-control { height: 38px; border: 1px solid #d1d5db; border-radius: 8px; padding: 0 10px; width: 100%; }
.sub-title { margin: 10px 0 8px; }
.mt-12 { margin-top: 12px; }

.table-like { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; min-height: 46px; }

.row { display: grid; gap: 8px; padding: 10px 12px; border-top: 1px solid #f1f5f9; align-items: center; }
.row.head { background: #f9fafb; border-top: 0; font-weight: 700; }

.row-pending { grid-template-columns: 1fr .6fr 1fr 1.2fr 1.4fr; }
.row-user { grid-template-columns: 1.2fr .8fr .6fr 1fr 1.4fr; }

.acts { display: flex; gap: 8px; flex-wrap: wrap; }

.btn {
  height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
</style>
