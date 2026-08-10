<script setup>
import { computed, reactive } from 'vue'
import { useAppDataStore } from '@/stores/appData'

const appData = useAppDataStore()
if (!appData.hydrated) appData.hydrate()

const form = reactive({
  title: '',
  category: '',
  publishedAt: '',
  summary: '',
  content: ''
})

const articles = computed(() => appData.articles || [])

function createArticle() {
  const title = form.title.trim()
  const category = form.category.trim()
  const publishedAt = form.publishedAt || new Date().toISOString().slice(0, 10)
  const summary = form.summary.trim()
  const content = form.content.trim()

  if (!title || !category || !summary) {
    alert('Please fill in Title, Category and Summary.')
    return
  }

  if (typeof appData.addArticle === 'function') {
    appData.addArticle({
      title,
      category,
      publishedAt,
      summary,
      content
    })
  } else {
    appData.articles.unshift({
      id: crypto.randomUUID(),
      title,
      category,
      publishedAt,
      summary,
      content
    })
  }

  if (typeof appData.persist === 'function') appData.persist()

  form.title = ''
  form.category = ''
  form.publishedAt = ''
  form.summary = ''
  form.content = ''
}

function removeArticle(id) {
  if (!confirm('Delete this article?')) return

  if (typeof appData.deleteArticle === 'function') {
    appData.deleteArticle(id)
  } else {
    appData.articles = appData.articles.filter((a) => a.id !== id)
  }

  if (typeof appData.persist === 'function') appData.persist()
}
</script>

<template>
  <section class="wire card">
    <h2>Content Management</h2>

    <div class="grid-2">
      <div class="block">
        <h4>Add Health Article</h4>

        <div class="form-item">
          <label class="form-label">Title</label>
          <input class="form-control" v-model="form.title" />
        </div>

        <div class="form-item">
          <label class="form-label">Category</label>
          <input class="form-control" v-model="form.category" />
        </div>

        <div class="form-item">
          <label class="form-label">Published Date</label>
          <input class="form-control" type="date" v-model="form.publishedAt" />
        </div>

        <div class="form-item">
          <label class="form-label">Summary</label>
          <textarea class="form-control" rows="3" v-model="form.summary"></textarea>
        </div>

        <div class="form-item">
          <label class="form-label">Content</label>
          <textarea class="form-control" rows="6" v-model="form.content"></textarea>
        </div>

        <button class="btn btn-pill-dark" @click="createArticle">Publish</button>
      </div>

      <div class="block">
        <h4>Article List</h4>
        <p class="meta">Total: {{ articles.length }}</p>
        <ul class="list">
          <li v-for="a in articles" :key="a.id">
            <span class="title">{{ a.title }} ({{ a.publishedAt || '-' }})</span>
            <button class="btn btn-pill-light" @click="removeArticle(a.id)">Delete</button>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.block { border:1px solid #d1d5db; border-radius:10px; padding:12px; background:#fff; }
.meta { margin: 0 0 8px; color:#6b7280; }
.list { list-style:none; margin:0; padding:0; }
.list li { display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e5e7eb; padding:10px 0; gap: 12px; }
.list li:last-child { border-bottom:none; }
.title { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
