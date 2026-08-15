<script setup>
import { computed, reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { load } from '@/utils/storage'
import { sendEmailWithAttachment } from '@/utils/email'
import InteractiveDataTable from '@/components/admin/InteractiveDataTable.vue'
import { exportCsv } from '@/utils/exportCsv'

const USERS_KEY = 'silver_users'
const auth = useAuthStore()
const version = ref(0)
const sending = ref(false)
const attachments = ref([])
const selectedUserIds = ref([])
const emailForm = reactive({ toName: '', toEmail: '', subject: '', message: '' })

const users = computed(() => {
  version.value
  return load(USERS_KEY, [])
})

const pendingAdmins = computed(() => users.value.filter((user) => user.role === 'admin-pending'))
const registeredUsers = computed(() => users.value.filter((user) => user.role !== 'admin-pending'))
const selectedRecipients = computed(() => registeredUsers.value.filter((user) => selectedUserIds.value.includes(user.id) && user.email))

const userColumns = [
  { key: 'selection', label: 'Select', searchable: false, sortable: false },
  { key: 'name', label: 'Name' },
  { key: 'role', label: 'Role' },
  { key: 'age', label: 'Age' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'actions', label: 'Email action', searchable: false, sortable: false }
]

const userExportColumns = userColumns.filter((column) => !['selection', 'actions'].includes(column.key))

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

function exportUsers() {
  exportCsv('registered-users.csv', userExportColumns, registeredUsers.value)
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve({ name: file.name, data: reader.result })
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function readAttachments(event) {
  const selectedFiles = Array.from(event.target.files || [])
  const availableSlots = 5 - attachments.value.length
  event.target.value = ''
  if (!selectedFiles.length) return
  if (selectedFiles.length > availableSlots) {
    alert(`You can attach up to 5 files. ${availableSlots} slot${availableSlots === 1 ? '' : 's'} remaining.`)
    return
  }
  if (selectedFiles.some((file) => file.size > 5 * 1024 * 1024)) {
    alert('Each attachment must be 5 MB or smaller.')
    return
  }
  try {
    attachments.value.push(...await Promise.all(selectedFiles.map(readFile)))
  } catch {
    alert('Unable to read one or more selected files.')
  }
}

function removeAttachment(index) {
  attachments.value.splice(index, 1)
}

function clearAttachments() {
  attachments.value = []
  const input = document.getElementById('email-attachment')
  if (input) input.value = ''
}

async function sendEmail() {
  if (!emailForm.toEmail || !emailForm.subject.trim() || !emailForm.message.trim() || !attachments.value.length) {
    alert('Recipient, subject, message and at least one attachment are required.')
    return
  }
  sending.value = true
  try {
    const result = await sendEmailWithAttachment({
      toEmail: emailForm.toEmail,
      toName: emailForm.toName,
      subject: emailForm.subject.trim(),
      message: emailForm.message.trim(),
      attachments: attachments.value
    })
    alert(result.message)
    if (result.ok) {
      emailForm.subject = ''
      emailForm.message = ''
      clearAttachments()
    }
  } catch {
    alert('Unable to contact the email service. Please try again.')
  } finally {
    sending.value = false
  }
}

async function sendBulkEmail() {
  if (!selectedRecipients.value.length || !emailForm.subject.trim() || !emailForm.message.trim()) {
    alert('Select at least one user and enter a subject and message.')
    return
  }
  sending.value = true
  try {
    const results = []
    for (const user of selectedRecipients.value) {
      results.push(await sendEmailWithAttachment({
        toEmail: user.email,
        toName: user.name,
        subject: emailForm.subject.trim(),
        message: emailForm.message.trim(),
        attachments: attachments.value
      }))
    }
    const delivered = results.filter((result) => result.ok).length
    alert(`${delivered} of ${selectedRecipients.value.length} emails sent.`)
    if (delivered === selectedRecipients.value.length) selectedUserIds.value = []
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
      <div class="section-heading"><h4>Registered Users</h4><button class="btn btn-pill-light" @click="exportUsers">Export CSV</button></div>
      <p class="meta">Search each column, click a heading to sort, and use pagination to view up to 10 records at a time.</p>
      <InteractiveDataTable :columns="userColumns" :rows="registeredUsers" empty-message="No registered users found.">
        <template #cell-selection="{ row }"><input v-model="selectedUserIds" type="checkbox" :value="row.id" :aria-label="`Select ${row.name} for bulk email`" /></template>
        <template #cell-actions="{ row }"><button class="btn btn-pill-light" @click="selectRecipient(row)">Compose email</button></template>
      </InteractiveDataTable>
    </div>

    <div id="email-composer" class="block">
      <div class="section-heading"><h4>Send Email with Attachment</h4><span class="selected-count">{{ selectedRecipients.length }} selected for bulk email</span></div>
      <p class="meta">Select one user to compose an individual email, or tick multiple users and send one message to all selected users.</p>
      <div class="email-grid">
        <label>Recipient name<input v-model="emailForm.toName" /></label>
        <label>Recipient email<input v-model="emailForm.toEmail" type="email" /></label>
        <label class="wide">Subject<input v-model="emailForm.subject" /></label>
        <label class="wide">Message<textarea v-model="emailForm.message" rows="5"></textarea></label>
        <label class="wide">Attachments (up to 5)<input id="email-attachment" type="file" multiple @change="readAttachments" /><span>Each file must be 5 MB or smaller.</span><ul v-if="attachments.length" class="attachment-list"><li v-for="(file, index) in attachments" :key="`${file.name}-${index}`"><span>{{ file.name }}</span><button type="button" class="remove-attachment" @click="removeAttachment(index)">Remove</button></li></ul></label>
      </div>
      <div class="email-actions"><button class="btn btn-pill-dark" :disabled="sending" @click="sendEmail">{{ sending ? 'Sending…' : 'Send email' }}</button><button class="btn btn-pill-light" :disabled="sending || !selectedRecipients.length" @click="sendBulkEmail">{{ sending ? 'Sending…' : `Send to selected users (${selectedRecipients.length})` }}</button></div>
    </div>
  </section>
</template>

<style scoped>
.wire { display: grid; gap: 14px; }
.block { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
.section-heading { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.section-heading h4 { margin: 0; }
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
.selected-count { color: #475569; font-size: .9rem; }.email-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.attachment-list { display: grid; gap: 5px; margin: 2px 0 0; padding: 0; list-style: none; }.attachment-list li { display: flex; align-items: center; justify-content: space-between; gap: 10px; color: #334155; }.remove-attachment { border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; padding: 3px 8px; cursor: pointer; font: inherit; }
@media (max-width: 760px) { .pending-row { min-width: 700px; } .pending-list { overflow-x: auto; } .email-grid { grid-template-columns: 1fr; } }
</style>
