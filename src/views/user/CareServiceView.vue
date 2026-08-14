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
          <label class="form-label" :for="`care-name-${s.id}`">Name</label>
          <input :id="`care-name-${s.id}`" class="form-control" v-model="forms[s.id].name" autocomplete="name" placeholder="Name" :aria-invalid="!!errorsMap[s.id].name" :aria-describedby="`care-name-error-${s.id}`" @blur="validate(s.id)" />
          <p :id="`care-name-error-${s.id}`" class="error-text" role="alert">{{ errorsMap[s.id].name }}</p>

          <label class="form-label" :for="`care-phone-${s.id}`">Phone</label>
          <input :id="`care-phone-${s.id}`" class="form-control" v-model="forms[s.id].phone" autocomplete="tel" placeholder="Phone" :aria-invalid="!!errorsMap[s.id].phone" :aria-describedby="`care-phone-error-${s.id}`" @blur="validate(s.id)" />
          <p :id="`care-phone-error-${s.id}`" class="error-text" role="alert">{{ errorsMap[s.id].phone }}</p>

          <label class="form-label" :for="`care-address-${s.id}`">Address</label>
          <input :id="`care-address-${s.id}`" class="form-control" v-model="forms[s.id].address" autocomplete="street-address" placeholder="Address" :aria-invalid="!!errorsMap[s.id].address" :aria-describedby="`care-address-error-${s.id}`" @blur="validate(s.id)" />
          <p :id="`care-address-error-${s.id}`" class="error-text" role="alert">{{ errorsMap[s.id].address }}</p>

          <label class="form-label" :for="`care-time-${s.id}`">Preferred visit time</label>
          <input
            :id="`care-time-${s.id}`"
            class="form-control"
            type="datetime-local"
            lang="en"
            v-model="forms[s.id].visitTime"
            :aria-invalid="!!errorsMap[s.id].visitTime"
            :aria-describedby="`care-time-error-${s.id}`"
            @blur="validate(s.id)"
          />
          <p :id="`care-time-error-${s.id}`" class="error-text" role="alert">{{ errorsMap[s.id].visitTime }}</p>

          <label class="form-label" :for="`care-note-${s.id}`">Additional note</label>
          <textarea :id="`care-note-${s.id}`" class="form-control" v-model="forms[s.id].note" placeholder="Additional note"></textarea>
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
