<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import StarRating from '@/components/common/StarRating.vue'
import { useAppDataStore } from '@/stores/appData'
import { useAuthStore } from '@/stores/auth'

const data = useAppDataStore()
const auth = useAuthStore()
const router = useRouter()
const keyword = ref('')

onMounted(() => data.hydrate())

const list = computed(() =>
  data.articles.filter((a) =>
    [a.title, a.category, a.summary].join(' ').toLowerCase().includes(keyword.value.toLowerCase())
  )
)

function isFav(articleId) {
  if (!auth.user) return false
  return data.favorites.some((f) => f.userId === auth.user.id && f.articleId === articleId)
}

function toggle(articleId) {
  if (!auth.user) return router.push('/auth/login')
  data.toggleFavorite(auth.user.id, articleId)
}

const readingOpen = ref(false)
const activeArticle = ref(null)

function openReading(article) {
  activeArticle.value = article
  readingOpen.value = true
}

function closeReading() {
  readingOpen.value = false
  activeArticle.value = null
}

const ratingForm = reactive({})

function submitRating(articleId) {
  if (!auth.user) return router.push('/auth/login')
  const stars = ratingForm[articleId]?.stars || 0
  const comment = ratingForm[articleId]?.comment || ''
  const res = data.submitRating({
    userId: auth.user.id,
    targetType: 'article',
    targetId: articleId,
    stars,
    comment,
  })
  alert(res.message)
}

function summary(id) {
  return data.articleSummary(id)
}
</script>

<template>
  <section>
    <h1>Health Information</h1>
    <input class="form-control" v-model="keyword" placeholder="Search articles..." />

    <div class="grid-2 mt-16">
      <article class="card" v-for="a in list" :key="a.id">
        <h3>{{ a.title }}</h3>
        <p>{{ a.category }} | {{ a.publishedAt }}</p>
        <p>{{ a.summary }}</p>

        <div class="action-row">
          <button class="btn-secondary" @click="toggle(a.id)">
            {{ isFav(a.id) ? 'Unfavorite' : 'Favorite' }}
          </button>
          <button class="btn-secondary" @click="openReading(a)">
            Reading
          </button>
        </div>

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

    <div v-if="readingOpen" class="reading-modal-mask" @click.self="closeReading">
      <div class="reading-modal card">
        <div class="reading-head">
          <h3>{{ activeArticle?.title }}</h3>
          <button class="btn-secondary" @click="closeReading">Close</button>
        </div>
        <p class="reading-meta">{{ activeArticle?.category }} | {{ activeArticle?.publishedAt }}</p>
        <p class="reading-summary">{{ activeArticle?.summary }}</p>
        <div class="reading-content">{{ activeArticle?.content }}</div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.action-row {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.mt-8 {
  margin-top: 8px;
}

.reading-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.42);
  display: grid;
  place-items: center;
  z-index: 999;
  padding: 16px;
}

.reading-modal {
  width: min(760px, 96vw);
  max-height: 82vh;
  overflow: auto;
  background: #fff;
}

.reading-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.reading-meta {
  color: #4b5563;
  margin-top: 8px;
}

.reading-summary {
  margin-top: 10px;
  font-weight: 600;
}

.reading-content {
  margin-top: 12px;
  line-height: 1.7;
  white-space: pre-line;
}
</style>
