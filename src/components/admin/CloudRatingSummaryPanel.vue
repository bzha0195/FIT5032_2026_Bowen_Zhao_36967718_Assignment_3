<script setup>
import { ref } from 'vue'

const FUNCTION_URL = 'https://getratingsummary-rh4qbiws3a-de.a.run.app'
const targetType = ref('activity')
const targetId = ref('')
const loading = ref(false)
const result = ref(null)
const error = ref('')

async function getRatingSummary() {
  loading.value = true
  result.value = null
  error.value = ''
  try {
    const url = new URL(FUNCTION_URL)
    if (targetType.value.trim()) url.searchParams.set('targetType', targetType.value.trim())
    if (targetId.value.trim()) url.searchParams.set('targetId', targetId.value.trim())
    const response = await fetch(url)
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || 'Cloud function request failed.')
    result.value = payload
  } catch (requestError) {
    error.value = requestError.message || 'Unable to reach the cloud function.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="cloud-summary">
    <div><h3>Rating Enquiry</h3></div>
    <form class="request-form" @submit.prevent="getRatingSummary">
      <label>Rating type<select v-model="targetType"><option value="activity">Activity</option><option value="service">Service</option><option value="article">Article</option></select></label>
      <label>Target ID (optional)<input v-model="targetId" placeholder="Enter a target ID" /></label>
      <button class="btn btn-pill-dark" :disabled="loading" type="submit">{{ loading ? 'Calling…' : 'Get rating summary' }}</button>
    </form>
    <p v-if="error" class="error-text" role="alert">{{ error }}</p>
    <div v-if="result" class="result" aria-live="polite"><strong>{{ result.total }} ratings · {{ result.average }} / 5 average</strong><span>1★ {{ result.distribution[1] }}, 2★ {{ result.distribution[2] }}, 3★ {{ result.distribution[3] }}, 4★ {{ result.distribution[4] }}, 5★ {{ result.distribution[5] }}</span></div>
  </section>
</template>

<style scoped>
.cloud-summary { border: 1px solid #d1d5db; border-radius: 10px; padding: 16px; background: #fff; }.cloud-summary h3, .cloud-summary p { margin: 0; }.cloud-summary p { color: #64748b; margin-top: 4px; }
.request-form { display: grid; grid-template-columns: 1fr 1fr auto; gap: 10px; align-items: end; margin-top: 14px; }.request-form label { display: grid; gap: 5px; font-size: .9rem; color: #475569; }.request-form input, .request-form select { min-height: 38px; border: 1px solid #cbd5e1; border-radius: 7px; padding: 7px; font: inherit; }.error-text { color: #b91c1c; }.result { display: grid; gap: 5px; margin-top: 12px; padding: 10px; border-radius: 7px; background: #f1f5f9; }.result span { color: #475569; }
@media (max-width: 720px) { .request-form { grid-template-columns: 1fr; }.request-form button { justify-self: start; } }
</style>
