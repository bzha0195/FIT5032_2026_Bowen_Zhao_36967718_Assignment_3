import { defineStore } from 'pinia'
import { load, save } from '@/utils/storage'
import { sanitizeText, stripDangerousTags } from '@/utils/security'
import { calcRatingSummary } from '@/utils/rating'

import activitiesSeed from '@/data/activities.json'
import articlesSeed from '@/data/articles.json'
import servicesSeed from '@/data/services.json'

const DB_KEY = 'silver_data'
const DB_VERSION = 4

function seedDB() {
  const db = load(DB_KEY, null)
  if (db) return
  save(DB_KEY, {
    __version: DB_VERSION,
    activities: activitiesSeed,
    articles: articlesSeed,
    services: servicesSeed,
    bookings: [],
    careApplications: [],
    favorites: [],
    ratings: [],
  })
}

function normalizeSummary(raw) {
  const avg = raw?.avg ?? raw?.average ?? 0
  const total = raw?.total ?? raw?.count ?? 0
  const percent = raw?.percent ?? {}
  const distribution = raw?.distribution ?? {}
  const mergedPercent = {
    1: percent[1] ?? 0,
    2: percent[2] ?? 0,
    3: percent[3] ?? 0,
    4: percent[4] ?? 0,
    5: percent[5] ?? 0,
  }
  const mergedDistribution = {
    1: distribution[1] ?? 0,
    2: distribution[2] ?? 0,
    3: distribution[3] ?? 0,
    4: distribution[4] ?? 0,
    5: distribution[5] ?? 0,
  }
  return {
    avg,
    total,
    percent: mergedPercent,
    average: avg,
    count: total,
    distribution: mergedDistribution,
  }
}

export const useAppDataStore = defineStore('appData', {
  state: () => ({
    hydrated: false,
    activities: [],
    articles: [],
    services: [],
    bookings: [],
    careApplications: [],
    favorites: [],
    ratings: [],
  }),
  getters: {
    activitySummary: (s) => (id) =>
      normalizeSummary(
        calcRatingSummary(s.ratings.filter((r) => r.targetType === 'activity' && r.targetId === id))
      ),
    serviceSummary: (s) => (id) =>
      normalizeSummary(
        calcRatingSummary(s.ratings.filter((r) => r.targetType === 'service' && r.targetId === id))
      ),
    articleSummary: (s) => (id) =>
      normalizeSummary(
        calcRatingSummary(s.ratings.filter((r) => r.targetType === 'article' && r.targetId === id))
      ),
  },
  actions: {
    hydrate() {
      if (this.hydrated) return

      seedDB()
      const db = load(DB_KEY, {})

      this.activities = db.activities || []
      this.articles = db.articles || []
      this.services = db.services || []
      this.bookings = db.bookings || []
      this.careApplications = db.careApplications || []
      this.favorites = db.favorites || []
      this.ratings = db.ratings || []

      let changed = false
      const currentVersion = Number(db.__version || 0)

      if (currentVersion < DB_VERSION) {
        this.activities = activitiesSeed
        this.articles = articlesSeed
        this.services = servicesSeed
        changed = true
      }

      if (changed) this.persist()
      this.hydrated = true
    },
    persist() {
      save(DB_KEY, {
        __version: DB_VERSION,
        activities: this.activities,
        articles: this.articles,
        services: this.services,
        bookings: this.bookings,
        careApplications: this.careApplications,
        favorites: this.favorites,
        ratings: this.ratings,
      })
    },
    toggleFavorite(userId, articleId) {
      const idx = this.favorites.findIndex((f) => f.userId === userId && f.articleId === articleId)
      if (idx >= 0) this.favorites.splice(idx, 1)
      else this.favorites.push({ id: crypto.randomUUID(), userId, articleId })
      this.persist()
    },
    toggleBooking({ userId, activityId }) {
      const bookingIdx = this.bookings.findIndex((b) => b.userId === userId && b.activityId === activityId)
      const act = this.activities.find((a) => a.id === activityId)
      if (!act) return { ok: false, message: 'Activity not found' }

      if (bookingIdx >= 0) {
        this.bookings.splice(bookingIdx, 1)
        act.booked = Math.max(0, (act.booked || 0) - 1)
        this.persist()
        return { ok: true, mode: 'unbook', message: 'Unbooked successfully' }
      }

      if ((act.booked || 0) >= act.quota) return { ok: false, message: 'No remaining slots' }

      act.booked = (act.booked || 0) + 1
      this.bookings.push({
        id: crypto.randomUUID(),
        userId,
        activityId,
        status: 'booked',
        createdAt: new Date().toISOString(),
      })
      this.persist()
      return { ok: true, mode: 'book', message: 'Booked successfully' }
    },
    bookActivity({ userId, activityId }) {
      if (this.bookings.some((b) => b.userId === userId && b.activityId === activityId)) {
        return { ok: false, message: 'Already booked' }
      }
      const act = this.activities.find((a) => a.id === activityId)
      if (!act) return { ok: false, message: 'Activity not found' }
      if ((act.booked || 0) >= act.quota) return { ok: false, message: 'No remaining slots' }

      act.booked = (act.booked || 0) + 1
      this.bookings.push({
        id: crypto.randomUUID(),
        userId,
        activityId,
        status: 'booked',
        createdAt: new Date().toISOString(),
      })
      this.persist()
      return { ok: true, message: 'Booked successfully' }
    },
    applyCareService(payload) {
      this.careApplications.push({
        id: crypto.randomUUID(),
        userId: payload.userId,
        serviceId: payload.serviceId,
        name: sanitizeText(payload.name),
        phone: sanitizeText(payload.phone),
        address: sanitizeText(payload.address),
        visitTime: payload.visitTime,
        note: sanitizeText(stripDangerousTags(payload.note || '')),
        status: 'pending',
        createdAt: new Date().toISOString(),
      })
      this.persist()
      return { ok: true, message: 'Application submitted' }
    },
    cancelCareApplication(id, userId) {
      const idx = this.careApplications.findIndex((x) => x.id === id && x.userId === userId)
      if (idx < 0) return { ok: false, message: 'Application not found' }

      if (this.careApplications[idx].status !== 'pending') {
        return { ok: false, message: 'Only pending applications can be canceled' }
      }

      this.careApplications.splice(idx, 1)
      this.persist()
      return { ok: true, message: 'Application canceled' }
    },
    submitRating({ userId, targetType, targetId, stars, comment }) {
      if (this.ratings.some((r) => r.userId === userId && r.targetType === targetType && r.targetId === targetId)) {
        return { ok: false, message: 'You can rate this item only once' }
      }
      this.ratings.push({
        id: crypto.randomUUID(),
        userId,
        targetType,
        targetId,
        stars: Number(stars),
        comment: sanitizeText(stripDangerousTags(comment || '')),
        createdAt: new Date().toISOString(),
      })
      this.persist()
      return { ok: true, message: 'Rating submitted' }
    },
    deleteRating({ userId, targetType, targetId }) {
      const idx = this.ratings.findIndex(
        (r) => r.userId === userId && r.targetType === targetType && r.targetId === targetId
      )
      if (idx < 0) return { ok: false, message: 'Rating not found' }
      this.ratings.splice(idx, 1)
      this.persist()
      return { ok: true, message: 'Rating deleted' }
    },

    addArticle(article) {
      this.articles.unshift({
        id: crypto.randomUUID(),
        title: sanitizeText(article.title || ''),
        category: sanitizeText(article.category || ''),
        publishedAt: article.publishedAt || new Date().toISOString().slice(0, 10),
        summary: sanitizeText(article.summary || ''),
        content: sanitizeText(stripDangerousTags(article.content || '')),
      })
      this.persist()
    },
    removeArticle(id) {
      this.articles = this.articles.filter((a) => a.id !== id)
      this.favorites = this.favorites.filter((f) => f.articleId !== id)
      this.ratings = this.ratings.filter((r) => !(r.targetType === 'article' && r.targetId === id))
      this.persist()
    },
    deleteArticle(id) {
      this.removeArticle(id)
    },

    addActivity(payload) {
      this.activities.unshift({
        id: crypto.randomUUID(),
        title: sanitizeText(payload.title || ''),
        type: sanitizeText(payload.type || ''),
        time: sanitizeText(payload.time || ''),
        location: sanitizeText(payload.location || ''),
        quota: Number(payload.quota || 0),
        booked: Number(payload.booked || 0),
        description: sanitizeText(stripDangerousTags(payload.description || '')),
      })
      this.persist()
    },
    removeActivity(id) {
      this.activities = this.activities.filter((a) => a.id !== id)
      this.bookings = this.bookings.filter((b) => b.activityId !== id)
      this.ratings = this.ratings.filter((r) => !(r.targetType === 'activity' && r.targetId === id))
      this.persist()
    },
    deleteActivity(id) {
      this.removeActivity(id)
    },

    addService(payload) {
      this.services.unshift({
        id: crypto.randomUUID(),
        name: sanitizeText(payload.name || ''),
        type: sanitizeText(payload.type || payload.category || ''),
        description: sanitizeText(stripDangerousTags(payload.description || '')),
      })
      this.persist()
    },
    removeService(id) {
      this.services = this.services.filter((s) => s.id !== id)
      this.careApplications = this.careApplications.filter((c) => c.serviceId !== id)
      this.ratings = this.ratings.filter((r) => !(r.targetType === 'service' && r.targetId === id))
      this.persist()
    },
    deleteService(id) {
      this.removeService(id)
    },

    updateApplicationStatus(id, status) {
      const target = this.careApplications.find((x) => x.id === id)
      if (!target) return
      target.status = status
      this.persist()
    },
  },
})
