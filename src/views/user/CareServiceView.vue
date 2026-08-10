<script setup>
import { computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import StarRating from '@/components/common/StarRating.vue'
import { useAppDataStore } from '@/stores/appData'
import { useAuthStore } from '@/stores/auth'
import { required, phoneCN } from '@/utils/validators'

const data = useAppDataStore()
const auth = useAuthStore()
const router = useRouter()

onMounted(() => data.hydrate())

const services = computed(() => data.services)

const forms = reactive({})
const errorsMap = reactive({})
const ratingForm = reactive({})

function ensureServiceState(serviceId) {
  if (!forms[serviceId]) {
    forms[serviceId] = { name: '', phone: '', address: '', visitTime: '', note: '' }
  }
  if (!errorsMap[serviceId]) {
    errorsMap[serviceId] = { name: '', phone: '', address: '', visitTime: '' }
  }
  if (!ratingForm[serviceId]) {
    ratingForm[serviceId] = { stars: 0, comment: '' }
  }
}

function validate(serviceId) {
  ensureServiceState(serviceId)
  const f = forms[serviceId]
  const e = errorsMap[serviceId]
  e.name = required(f.name, 'Name')
  e.phone = required(f.phone, 'Phone') || phoneCN(f.phone)
  e.address = required(f.address, 'Address')
  e.visitTime = required(f.visitTime, 'Time')
  return !e.name && !e.phone && !e.address && !e.visitTime
}

function apply(serviceId) {
  if (!auth.user) return router.push('/auth/login')
  ensureServiceState(serviceId)
  if (!validate(serviceId)) return
  const f = forms[serviceId]
  const res = data.applyCareService({
    userId: auth.user.id,
    serviceId,
    ...f,
  })
  alert(res.message)
  forms[serviceId].note = ''
}

function submitRating(serviceId) {
  if (!auth.user) return router.push('/auth/login')
  ensureServiceState(serviceId)
  const stars = ratingForm[serviceId]?.stars || 0
  const comment = ratingForm[serviceId]?.comment || ''
  const res = data.submitRating({
    userId: auth.user.id,
    targetType: 'service',
    targetId: serviceId,
    stars,
    comment,
  })
  alert(res.message)
}
</script>

<template>
  <section>
    <h1>Care Services</h1>
    <div class="grid-2">
      <article class="card" v-for="s in services" :key="s.id">
        {{ ensureServiceState(s.id) && '' }}
        <h3>{{ s.name }}</h3>
        <p>{{ s.type }}</p>
        <p>{{ s.description }}</p>

        <div class="form-item">
          <input class="form-control" v-model="forms[s.id].name" placeholder="Name" @blur="validate(s.id)" />
          <p class="error-text">{{ errorsMap[s.id].name }}</p>

          <input class="form-control" v-model="forms[s.id].phone" placeholder="Phone" @blur="validate(s.id)" />
          <p class="error-text">{{ errorsMap[s.id].phone }}</p>

          <input class="form-control" v-model="forms[s.id].address" placeholder="Address" @blur="validate(s.id)" />
          <p class="error-text">{{ errorsMap[s.id].address }}</p>

          <input
            class="form-control"
            type="datetime-local"
            lang="en"
            v-model="forms[s.id].visitTime"
            @blur="validate(s.id)"
          />
          <p class="error-text">{{ errorsMap[s.id].visitTime }}</p>

          <textarea class="form-control" v-model="forms[s.id].note" placeholder="Additional note"></textarea>
          <button class="btn-primary" @click="apply(s.id)">Submit Application</button>
        </div>

        <hr />
        <p><strong>Average:</strong> {{ data.serviceSummary(s.id).avg }} / 5 ({{ data.serviceSummary(s.id).total }} reviews)</p>
        <StarRating v-model="ratingForm[s.id].stars" />
        <textarea class="form-control" v-model="ratingForm[s.id].comment" placeholder="Write your feedback"></textarea>
        <button class="btn-secondary mt-8" @click="submitRating(s.id)">Submit Rating</button>
      </article>
    </div>
  </section>
</template>
