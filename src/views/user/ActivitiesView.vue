<script setup>
import { computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import StarRating from '@/components/common/StarRating.vue'
import { useAppDataStore } from '@/stores/appData'
import { useAuthStore } from '@/stores/auth'

const data = useAppDataStore()
const auth = useAuthStore()
const router = useRouter()

onMounted(() => data.hydrate())

const ratingForm = reactive({})

const list = computed(() => data.activities)

function isBooked(activityId) {
  if (!auth.user) return false
  return data.bookings.some((b) => b.userId === auth.user.id && b.activityId === activityId)
}

async function book(activityId) {
  if (!auth.user) return router.push('/auth/login')
  alert((await data.toggleBooking({ userId: auth.user.id, activityId })).message)
}

function submitRating(activityId) {
  if (!auth.user) return router.push('/auth/login')
  const stars = ratingForm[activityId]?.stars || 0
  const comment = ratingForm[activityId]?.comment || ''
  const res = data.submitRating({
    userId: auth.user.id,
    targetType: 'activity',
    targetId: activityId,
    stars,
    comment,
  })
  alert(res.message)
}

function summary(id) {
  return data.activitySummary(id)
}
</script>

<template>
  <section>
    <h1>Charity Activities</h1>
    <div class="grid-2">
      <article class="card" v-for="a in list" :key="a.id">
        <h3>{{ a.title }}</h3>
        <p>{{ a.type }} | {{ a.time }} | {{ a.location }}</p>
        <p>{{ a.description }}</p>
        <p>Remaining slots: {{ (a.quota || 0) - (a.booked || 0) }}</p>
        <button class="btn-primary" @click="book(a.id)">
          {{ isBooked(a.id) ? 'Unbook' : 'Book' }}
        </button>

        <hr />
        <p><strong>Average:</strong> {{ summary(a.id).avg }} / 5 ({{ summary(a.id).total }} reviews)</p>
        <p>
          5★ {{ summary(a.id).percent[5] }}% |
          4★ {{ summary(a.id).percent[4] }}% |
          3★ {{ summary(a.id).percent[3] }}% |
          2★ {{ summary(a.id).percent[2] }}% |
          1★ {{ summary(a.id).percent[1] }}%
        </p>

        <StarRating v-model="ratingForm[a.id].stars" v-if="(ratingForm[a.id] ||= { stars: 0, comment: '' })" />
        <textarea class="form-control" v-model="ratingForm[a.id].comment" placeholder="Write your feedback"></textarea>
        <button class="btn-secondary mt-8" @click="submitRating(a.id)">Submit Rating</button>
      </article>
    </div>
  </section>
</template>
