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
  <section class="cloud-summary card">
    <h1>Cloud Rating Summary</h1>
    

    <form class="request-form" @submit.prevent="getRatingSummary">
      <label>Rating type<select v-model="targetType"><option value="activity">Activity</option><option value="service">Service</option><option value="article">Article</option></select></label>
      <label>Rating target ID (optional)<input v-model="targetId" placeholder="Enter a target ID" /></label>
      <button class="btn btn-pill-dark" :disabled="loading" type="submit">{{ loading ? 'Calling cloud function…' : 'Get rating summary' }}</button>
    </form>

    <p v-if="error" class="error-text" role="alert">{{ error }}</p>
    <div v-if="result" class="result" aria-live="polite">
      <p><strong>Total ratings:</strong> {{ result.total }}</p>
      <p><strong>Average rating:</strong> {{ result.average }} / 5</p>
      <p><strong>Distribution:</strong> 1★ {{ result.distribution[1] }}, 2★ {{ result.distribution[2] }}, 3★ {{ result.distribution[3] }}, 4★ {{ result.distribution[4] }}, 5★ {{ result.distribution[5] }}</p>
    </div>
  </section>
</template>

<style scoped>
.cloud-summary { max-width: 760px; margin: 0 auto; }
.cloud-summary h1 { margin-top: 0; }
.request-form { display: grid; gap: 14px; margin-top: 20px; }
.request-form label { display: grid; gap: 6px; font-weight: 700; }
.request-form input, .request-form select { min-height: 44px; border: 1px solid #9ca3af; border-radius: 6px; padding: 8px 10px; font: inherit; background: #fff; }
.request-form button { justify-self: start; }
.result { margin-top: 18px; border: 1px solid #d1d5db; border-radius: 8px; padding: 14px; background: #f8fafc; }
.result p { margin: 6px 0; }
</style>
