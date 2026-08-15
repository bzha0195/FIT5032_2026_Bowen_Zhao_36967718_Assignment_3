<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/vue3/daygrid'
import interactionPlugin from '@fullcalendar/vue3/interaction'
import '@fullcalendar/vue3/skeleton.css'
import '@fullcalendar/vue3/themes/classic/theme.css'
import '@fullcalendar/vue3/themes/classic/palette.css'
import { useAppDataStore } from '@/stores/appData'
import { useAuthStore } from '@/stores/auth'

const data = useAppDataStore()
const auth = useAuthStore()
const router = useRouter()

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  initialDate: data.activities[0]?.time?.slice(0, 10) || undefined,
  headerToolbar: { left: 'prev,next', center: 'title', right: '' },
  height: 'auto',
  dayMaxEvents: 2,
  eventClick: handleEventClick,
  events: data.activities.map((activity) => {
    const booked = !!auth.user && data.bookings.some((item) => item.userId === auth.user.id && item.activityId === activity.id)
    const full = (activity.booked || 0) >= activity.quota
    return {
      id: activity.id,
      title: `${booked ? '🟢' : full ? '⚪' : '🔵'} ${activity.title}`,
      start: String(activity.time || '').replace(' ', 'T'),
      classNames: [booked ? 'calendar-booked' : full ? 'calendar-full' : 'calendar-available'],
      backgroundColor: booked ? '#15803d' : full ? '#9ca3af' : '#2563eb',
      borderColor: booked ? '#15803d' : full ? '#9ca3af' : '#2563eb',
      textColor: '#ffffff',
      extendedProps: { activity, booked, full }
    }
  })
}))

function handleEventClick(info) {
  const { activity, booked, full } = info.event.extendedProps
  if (!auth.isLoggedIn) {
    router.push('/auth/login')
    return
  }
  if (auth.role !== 'user') {
    alert('Please use an elderly user account to manage activity bookings.')
    return
  }
  if (full && !booked) {
    alert('No remaining slots for this activity.')
    return
  }
  const action = booked ? 'cancel this booking' : 'book this activity'
  if (!window.confirm(`Would you like to ${action}: ${activity.title}?`)) return
  const result = data.toggleBooking({ userId: auth.user.id, activityId: activity.id })
  alert(result.message)
}
</script>

<template>
  <div class="calendar-card">
    <div class="calendar-heading"><h2>Activity Booking Calendar</h2><span>Click an activity to book or cancel</span></div>
    <FullCalendar :options="calendarOptions" />
    <p class="calendar-key"><span class="available"></span>Available <span class="booked"></span>Your booking <span class="full"></span>Full</p>
  </div>
</template>

<style scoped>
.calendar-card { width: 100%; max-width: 560px; border: 1px solid #d1d5db; border-radius: 10px; padding: 12px; background: #fff; }
.calendar-heading { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; margin-bottom: 8px; }
.calendar-heading h2 { margin: 0; font-size: 1.08rem; }
.calendar-heading span, .calendar-key { color: #64748b; font-size: .78rem; }
.calendar-key { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin: 10px 0 0; }
.calendar-key span { width: 10px; height: 10px; border-radius: 50%; margin-left: 6px; }
.calendar-key span:first-child { margin-left: 0; }
.available { background: #2563eb; }.booked { background: #15803d; }.full { background: #9ca3af; }
:deep(.fc) { font-size: .78rem; }
:deep(.fc-toolbar-title) { font-size: 1rem; }
:deep(.fc-button) { background: #374151; border-color: #374151; font-size: .75rem; }
:deep(.fc-button:hover), :deep(.fc-button:focus) { background: #1f2937; border-color: #1f2937; }
:deep(.fc-daygrid-event) { border: 0; padding: 2px 4px; cursor: pointer; }
:deep(.calendar-available) { background: #2563eb; }
:deep(.calendar-booked) { background: #15803d; }
:deep(.calendar-full) { background: #9ca3af; }
@media (max-width: 720px) { .calendar-heading { display: block; }.calendar-heading span { display: block; margin-top: 4px; } }
</style>
