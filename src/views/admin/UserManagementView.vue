<script setup>
import { computed, reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { load } from '@/utils/storage'
import { sendEmailWithAttachment } from '@/utils/email'
import InteractiveDataTable from '@/components/admin/InteractiveDataTable.vue'

const USERS_KEY = 'silver_users'
const auth = useAuthStore()
const version = ref(0)
const sending = ref(false)
const attachment = ref(null)
const emailForm = reactive({ toName: '', toEmail: '', subject: '', message: '' })

const users = computed(() => {
  version.value
  return load(USERS_KEY, [])
})

const pendingAdmins = computed(() => users.value.filter((user) => user.role === 'admin-pending'))
const registeredUsers = computed(() => users.value.filter((user) => user.role !== 'admin-pending'))

const userColumns = [
  { key: 'name', label: 'Name' },
  { key: 'role', label: 'Role' },
  { key: 'age', label: 'Age' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'actions', label: 'Email action', searchable: false, sortable: false }
]

function refresh() {
  version.value++
}

function approve(id) {
  const result = auth.approveAdmin(id)
  alert(result.message || (result.ok ? 'Approved' : 'Failed'))
  refresh()
}

function reject(id) {
  const result = auth.rejectAdmin(id)
  alert(result.message || (result.ok ? 'Done' : 'Failed'))
  refresh()
}

function selectRecipient(user) {
  emailForm.toName = user.name || ''
  emailForm.toEmail = user.email || ''
  emailForm.subject = 'Update from Silver Health Charity'
  emailForm.message = `Hello ${user.name || ''},\n\n`
  document.getElementById('email-composer')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function readAttachment(event) {
  const file = event.target.files?.[0]
  attachment.value = null
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    event.target.value = ''
    alert('Attachment must be 5 MB or smaller.')
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    attachment.value = { name: file.name, data: reader.result }
  }
  reader.readAsDataURL(file)
}

async function sendEmail() {
  if (!emailForm.toEmail || !emailForm.subject.trim() || !emailForm.message.trim() || !attachment.value) {
    alert('Recipient, subject, message and attachment are required.')
    return
  }
  sending.value = true
  try {
    const result = await sendEmailWithAttachment({
      toEmail: emailForm.toEmail,
      toName: emailForm.toName,
      subject: emailForm.subject.trim(),
      message: emailForm.message.trim(),
      attachment: attachment.value
    })
    alert(result.message)
    if (result.ok) {
      emailForm.subject = ''
      emailForm.message = ''
      attachment.value = null
      const input = document.getElementById('email-attachment')
      if (input) input.value = ''
    }
  } catch {
    alert('Unable to contact the email service. Please try again.')
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <section class="wire card">
    <h2>User Management</h2>

    <div class="block">
      <h4>Pending Admin Approvals</h4>
      <div class="pending-list">
        <div class="pending-row pending-head"><span>Name</span><span>Age</span><span>Phone</span><span>Email</span><span>Action</span></div>
        <div class="pending-row" v-for="user in pendingAdmins" :key="user.id">
          <span>{{ user.name }}</span><span>{{ user.age }}</span><span>{{ user.phone }}</span><span>{{ user.email }}</span>
          <span class="actions"><button class="btn btn-pill-dark" @click="approve(user.id)">Approve</button><button class="btn btn-pill-light" @click="reject(user.id)">Reject</button></span>
        </div>
        <p v-if="pendingAdmins.length === 0" class="empty-pending">No pending administrator accounts.</p>
      </div>
    </div>

    <div class="block">
      <h4>Registered Users</h4>
      <p class="meta">Search each column, click a heading to sort, and use pagination to view up to 10 records at a time.</p>
      <InteractiveDataTable :columns="userColumns" :rows="registeredUsers" empty-message="No registered users found.">
        <template #cell-actions="{ row }"><button class="btn btn-pill-light" @click="selectRecipient(row)">Compose email</button></template>
      </InteractiveDataTable>
    </div>

    <div id="email-composer" class="block">
      <h4>Send Email with Attachment</h4>
      <p class="meta">Select a user above, attach a file, then send through the configured email service.</p>
      <div class="email-grid">
        <label>Recipient name<input v-model="emailForm.toName" /></label>
        <label>Recipient email<input v-model="emailForm.toEmail" type="email" /></label>
        <label class="wide">Subject<input v-model="emailForm.subject" /></label>
        <label class="wide">Message<textarea v-model="emailForm.message" rows="5"></textarea></label>
        <label class="wide">Attachment<input id="email-attachment" type="file" @change="readAttachment" /><span v-if="attachment">Selected: {{ attachment.name }}</span></label>
      </div>
      <button class="btn btn-pill-dark" :disabled="sending" @click="sendEmail">{{ sending ? 'Sending…' : 'Send email' }}</button>
    </div>
  </section>
</template>

<style scoped>
.wire { display: grid; gap: 14px; }
.block { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
.meta, .empty-pending { color: #64748b; margin: 0 0 10px; }
.pending-list { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
.pending-row { display: grid; grid-template-columns: 1fr .5fr 1fr 1.25fr 1.4fr; gap: 8px; padding: 10px 12px; border-top: 1px solid #f1f5f9; align-items: center; }
.pending-head { background: #f9fafb; border-top: 0; font-weight: 700; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; }
.empty-pending { padding: 10px 12px; margin: 0; }
.btn { min-height: 34px; padding: 0 12px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; line-height: 1; }
.email-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 12px; }
.email-grid label { display: grid; gap: 5px; color: #475569; font-size: .9rem; }
.email-grid input, .email-grid textarea { border: 1px solid #cbd5e1; border-radius: 7px; padding: 9px; font: inherit; }
.email-grid textarea { resize: vertical; }
.wide { grid-column: 1 / -1; }
@media (max-width: 760px) { .pending-row { min-width: 700px; } .pending-list { overflow-x: auto; } .email-grid { grid-template-columns: 1fr; } }
</style>
