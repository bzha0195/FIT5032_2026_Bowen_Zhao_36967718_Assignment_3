<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAppDataStore } from '@/stores/appData'
import { load } from '@/utils/storage'
import CloudRatingSummaryPanel from '@/components/admin/CloudRatingSummaryPanel.vue'

const data = useAppDataStore()
const users = ref([])

onMounted(() => {
  data.hydrate()
  users.value = load('silver_users', []).filter((user) => user.role !== 'admin-pending')
})

const activityRows = computed(() => data.activities.map((activity) => ({
  id: activity.id,
  label: activity.title,
  value: data.bookings.filter((booking) => booking.activityId === activity.id).length
})).sort((left, right) => right.value - left.value).slice(0, 6))

const serviceRows = computed(() => data.services.map((service) => ({
  id: service.id,
  label: service.name,
  value: data.careApplications.filter((application) => application.serviceId === service.id).length
})).sort((left, right) => right.value - left.value).slice(0, 6))

const maxActivityValue = computed(() => Math.max(1, ...activityRows.value.map((row) => row.value)))
const maxServiceValue = computed(() => Math.max(1, ...serviceRows.value.map((row) => row.value)))
const totalApplications = computed(() => data.bookings.length + data.careApplications.length)
const averageRating = computed(() => {
  const ratings = data.ratings.filter((rating) => ['article', 'activity', 'service'].includes(rating.targetType))
  if (!ratings.length) return '0.0'
  return (ratings.reduce((total, rating) => total + Number(rating.stars || 0), 0) / ratings.length).toFixed(1)
})
</script>

<template>
  <section class="wire card">
    <div class="dashboard-heading"><div><h2>Data Dashboard</h2><p>Live operational data from the platform.</p></div></div>

    <div class="kpis">
      <div class="kpi"><p>Total Users</p><strong>{{ users.length }}</strong></div>
      <div class="kpi"><p>Activities</p><strong>{{ data.activities.length }}</strong></div>
      <div class="kpi"><p>Services</p><strong>{{ data.services.length }}</strong></div>
      <div class="kpi"><p>Applications</p><strong>{{ totalApplications }}</strong></div>
      <div class="kpi"><p>Avg Rating</p><strong>{{ averageRating }} / 5</strong></div>
    </div>

    <div class="grid-2 charts">
      <div class="block"><h4>Activity Booking Trend</h4><div class="bar-chart" aria-label="Activity booking chart"><div v-for="row in activityRows" :key="row.id" class="bar-row"><span :title="row.label">{{ row.label }}</span><div class="track"><div class="bar activity-bar" :style="{ width: `${(row.value / maxActivityValue) * 100}%` }"></div></div><strong>{{ row.value }}</strong></div><p v-if="activityRows.length === 0" class="empty">No activity data yet.</p></div></div>
      <div class="block"><h4>Service Application Trend</h4><div class="bar-chart" aria-label="Service application chart"><div v-for="row in serviceRows" :key="row.id" class="bar-row"><span :title="row.label">{{ row.label }}</span><div class="track"><div class="bar service-bar" :style="{ width: `${(row.value / maxServiceValue) * 100}%` }"></div></div><strong>{{ row.value }}</strong></div><p v-if="serviceRows.length === 0" class="empty">No service data yet.</p></div></div>
    </div>

    <CloudRatingSummaryPanel />
  </section>
</template>

<style scoped>
.wire { display: grid; gap: 14px; }.dashboard-heading { display: flex; justify-content: space-between; gap: 12px; align-items: start; }.dashboard-heading h2, .dashboard-heading p { margin: 0; }.dashboard-heading p { color: #64748b; }
.kpis { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 14px; }
.kpi { border: 1px solid #d1d5db; border-radius: 10px; padding: 12px; background:#fff; min-height: 72px; display: grid; gap: 6px; }.kpi p { margin: 0; color:#6b7280; }.kpi strong { font-size: 1.5rem; }
.charts { gap: 14px; }.block { border:1px solid #d1d5db; border-radius:10px; padding:12px; background:#fff; }.block h4 { margin: 0 0 14px; }.bar-chart { display: grid; gap: 11px; }.bar-row { display: grid; grid-template-columns: minmax(95px, 1fr) minmax(80px, 2fr) 28px; gap: 8px; align-items: center; }.bar-row > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.track { height: 14px; border-radius: 99px; background: #e5e7eb; overflow: hidden; }.bar { min-width: 2px; height: 100%; border-radius: inherit; }.activity-bar { background: #2563eb; }.service-bar { background: #15803d; }.empty { margin: 0; color: #64748b; }
@media (max-width: 900px){ .kpis{grid-template-columns: repeat(2,1fr);} }.dashboard-heading { flex-wrap: wrap; }
</style>
