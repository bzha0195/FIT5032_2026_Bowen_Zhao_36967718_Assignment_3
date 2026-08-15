<script setup>
import { ref } from 'vue'

const question = ref('')
const answer = ref('')
const error = ref('')
const loading = ref(false)
const functionUrl = import.meta.env.VITE_HEALTH_AI_FUNCTION_URL

async function askQuestion() {
  const text = question.value.trim()
  if (!text) return
  answer.value = ''
  error.value = ''
  if (!functionUrl) {
    error.value = 'The health assistant has not been configured yet.'
    return
  }
  loading.value = true
  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: text })
    })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || 'The health assistant could not answer this question.')
    answer.value = payload.answer || 'No answer was returned.'
  } catch (requestError) {
    error.value = requestError.message || 'Unable to contact the health assistant.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="assistant-card">
    <h2>Health AI Assistant</h2>
    <p>Ask a general health and wellbeing question in text.</p>
    <form @submit.prevent="askQuestion">
      <label for="health-ai-question">Your question</label>
      <textarea id="health-ai-question" v-model="question" rows="4" placeholder="For example: How can I stay active safely?" :disabled="loading"></textarea>
      <button class="btn btn-pill-dark" type="submit" :disabled="loading || !question.trim()">{{ loading ? 'Thinking…' : 'Ask DeepSeek' }}</button>
    </form>
    <p class="notice">General information only. Seek professional help for diagnosis, emergencies, or personalised treatment.</p>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <div v-if="answer" class="answer" aria-live="polite">{{ answer }}</div>
  </div>
</template>

<style scoped>
.assistant-card { min-height: 220px; border: 1px solid #d1d5db; border-radius: 10px; padding: 18px; background: #f8fafc; }
.assistant-card h2 { margin: 0 0 6px; font-size: 1.3rem; }.assistant-card p { margin: 6px 0; color: #475569; }
form { display: grid; gap: 7px; margin-top: 12px; } label { font-weight: 700; }
textarea { border: 1px solid #94a3b8; border-radius: 7px; padding: 9px; resize: vertical; font: inherit; }
button { justify-self: start; }.notice { font-size: .82rem; }.error { color: #b91c1c; font-weight: 700; }.answer { white-space: pre-wrap; margin-top: 12px; border: 1px solid #cbd5e1; border-radius: 7px; padding: 10px; background: #fff; }
</style>
