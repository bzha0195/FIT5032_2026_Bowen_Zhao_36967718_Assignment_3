import { defineStore } from 'pinia'
import { load, save } from '@/utils/storage'
import { sanitizeText, stripDangerousTags } from '@/utils/security'
import { calcRatingSummary } from '@/utils/rating'
import { firebaseAuth, firestoreDb } from '@/utils/firebase'
import { collection, deleteDoc, doc, getDocs, onSnapshot, query, runTransaction, setDoc, where } from 'firebase/firestore'
import activitiesSeed from '@/data/activities.json'
import articlesSeed from '@/data/articles.json'
import servicesSeed from '@/data/services.json'

const DB_KEY = 'silver_data'
const DB_VERSION = 5
const unsubscribers = []

function seedDB() {
  const db = load(DB_KEY, null)
  if (!db) save(DB_KEY, { __version: DB_VERSION, activities: activitiesSeed, articles: articlesSeed, services: servicesSeed, bookings: [], careApplications: [], favorites: [], ratings: [] })
}

function normalizeSummary(raw) {
  const avg = raw?.avg ?? raw?.average ?? 0
  const total = raw?.total ?? raw?.count ?? 0
  const percent = raw?.percent ?? {}
  const distribution = raw?.distribution ?? {}
  return { avg, total, percent: { 1: percent[1] ?? 0, 2: percent[2] ?? 0, 3: percent[3] ?? 0, 4: percent[4] ?? 0, 5: percent[5] ?? 0 }, average: avg, count: total, distribution: { 1: distribution[1] ?? 0, 2: distribution[2] ?? 0, 3: distribution[3] ?? 0, 4: distribution[4] ?? 0, 5: distribution[5] ?? 0 } }
}

function snapshotRows(snapshot) {
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
}

function fire(task) {
  task.catch((error) => console.error('Firestore synchronization failed:', error))
}

export const useAppDataStore = defineStore('appData', {
  state: () => ({ hydrated: false, usingFirestore: false, activeUserId: null, activeUserRole: 'guest', users: [], activities: [], articles: [], services: [], bookings: [], careApplications: [], favorites: [], ratings: [] }),
  getters: {
    activitySummary: (s) => (id) => normalizeSummary(calcRatingSummary(s.ratings.filter((r) => r.targetType === 'activity' && r.targetId === id))),
    serviceSummary: (s) => (id) => normalizeSummary(calcRatingSummary(s.ratings.filter((r) => r.targetType === 'service' && r.targetId === id))),
    articleSummary: (s) => (id) => normalizeSummary(calcRatingSummary(s.ratings.filter((r) => r.targetType === 'article' && r.targetId === id))),
  },
  actions: {
    hydrate() {
      if (this.hydrated) return
      seedDB()
      const db = load(DB_KEY, {})
      this.activities = db.activities || activitiesSeed
      this.articles = db.articles || articlesSeed
      this.services = db.services || servicesSeed
      this.bookings = db.bookings || []
      this.careApplications = db.careApplications || []
      this.favorites = db.favorites || []
      this.ratings = db.ratings || []
      this.hydrated = true
      this.persist()
      this.startFirestoreSync()
    },
    persist() {
      save(DB_KEY, { __version: DB_VERSION, activities: this.activities, articles: this.articles, services: this.services, bookings: this.bookings, careApplications: this.careApplications, favorites: this.favorites, ratings: this.ratings })
    },
    startFirestoreSync() {
      if (this.usingFirestore) return
      this.usingFirestore = true
      for (const name of ['activities', 'articles', 'services', 'ratings']) {
        unsubscribers.push(onSnapshot(collection(firestoreDb, name), (snapshot) => {
          const rows = snapshotRows(snapshot)
          if (rows.length) { this[name] = rows; this.persist() }
        }, (error) => console.error(`Unable to read ${name} from Firestore:`, error)))
      }
      firebaseAuth.onAuthStateChanged((user) => this.setFirestoreUser(user ? { id: user.uid, role: this.activeUserRole } : null))
    },
    setFirestoreUser(user) {
      const userId = user?.id || null
      const role = user?.role || 'guest'
      if (userId === this.activeUserId && role === this.activeUserRole) return
      this.activeUserId = userId
      this.activeUserRole = role
      while (unsubscribers.length > 4) unsubscribers.pop()()
      if (!userId) { this.users = []; this.bookings = []; this.careApplications = []; this.favorites = []; return }
      const isAdmin = role === 'admin'
      if (isAdmin) {
        unsubscribers.push(onSnapshot(collection(firestoreDb, 'users'), (snapshot) => { this.users = snapshotRows(snapshot) }, (error) => console.error('Unable to read users from Firestore:', error)))
      }
      for (const name of ['bookings', 'careApplications', 'favorites']) {
        const source = isAdmin ? collection(firestoreDb, name) : query(collection(firestoreDb, name), where('userId', '==', userId))
        unsubscribers.push(onSnapshot(source, (snapshot) => { this[name] = snapshotRows(snapshot); this.persist() }, (error) => console.error(`Unable to read ${name} from Firestore:`, error)))
      }
      if (isAdmin) fire(this.seedFirestoreData())
    },
    async seedFirestoreData() {
      const mergeRows = (defaults, current) => {
        const byId = new Map(defaults.map((row) => [row.id, row]))
        current.forEach((row) => byId.set(row.id, row))
        return [...byId.values()]
      }
      for (const [name, rows] of [
        ['activities', mergeRows(activitiesSeed, this.activities)],
        ['articles', mergeRows(articlesSeed, this.articles)],
        ['services', mergeRows(servicesSeed, this.services)]
      ]) {
        const existing = await getDocs(collection(firestoreDb, name))
        const existingIds = new Set(existing.docs.map((item) => item.id))
        await Promise.all(rows.filter((row) => !existingIds.has(row.id)).map((row) => setDoc(doc(firestoreDb, name, row.id), row)))
      }
    },
    remoteSet(name, row) { if (firebaseAuth.currentUser) fire(setDoc(doc(firestoreDb, name, row.id), row)) },
    remoteDelete(name, id) { if (firebaseAuth.currentUser) fire(deleteDoc(doc(firestoreDb, name, id))) },
    migrateLegacyUserData(legacyId, userId) {
      if (!legacyId || !userId || legacyId === userId || !firebaseAuth.currentUser) return
      for (const name of ['bookings', 'careApplications', 'favorites', 'ratings']) {
        this[name].filter((row) => row.userId === legacyId).forEach((row) => {
          row.userId = userId
          this.remoteSet(name, row)
        })
      }
      this.persist()
    },
    toggleFavorite(userId, articleId) {
      const index = this.favorites.findIndex((row) => row.userId === userId && row.articleId === articleId)
      if (index >= 0) { const id = this.favorites[index].id; this.favorites.splice(index, 1); this.remoteDelete('favorites', id) }
      else { const row = { id: crypto.randomUUID(), userId, articleId, createdAt: new Date().toISOString() }; this.favorites.push(row); this.remoteSet('favorites', row) }
      this.persist()
    },
    async toggleBooking({ userId, activityId }) {
      const booking = this.bookings.find((row) => row.userId === userId && row.activityId === activityId)
      const activity = this.activities.find((row) => row.id === activityId)
      if (!activity) return { ok: false, message: 'Activity not found' }
      if (!firebaseAuth.currentUser) return this.toggleLocalBooking({ userId, activityId })
      try {
        return await runTransaction(firestoreDb, async (transaction) => {
          const activityRef = doc(firestoreDb, 'activities', activityId)
          const currentSnapshot = await transaction.get(activityRef)
          if (!currentSnapshot.exists()) throw new Error('Activity not found')
          const current = currentSnapshot.data()
          if (booking) {
            transaction.delete(doc(firestoreDb, 'bookings', booking.id))
            transaction.update(activityRef, { booked: Math.max(0, Number(current.booked || 0) - 1) })
            return { ok: true, mode: 'unbook', message: 'Unbooked successfully' }
          }
          if (Number(current.booked || 0) >= Number(current.quota || 0)) throw new Error('No remaining slots')
          const row = { id: crypto.randomUUID(), userId, activityId, status: 'booked', createdAt: new Date().toISOString() }
          transaction.set(doc(firestoreDb, 'bookings', row.id), row)
          transaction.update(activityRef, { booked: Number(current.booked || 0) + 1 })
          return { ok: true, mode: 'book', message: 'Booked successfully' }
        })
      } catch (error) { return { ok: false, message: error.message || 'Unable to update booking' } }
    },
    toggleLocalBooking({ userId, activityId }) {
      const index = this.bookings.findIndex((row) => row.userId === userId && row.activityId === activityId)
      const activity = this.activities.find((row) => row.id === activityId)
      if (index >= 0) { this.bookings.splice(index, 1); activity.booked = Math.max(0, (activity.booked || 0) - 1); this.persist(); return { ok: true, mode: 'unbook', message: 'Unbooked successfully' } }
      if ((activity.booked || 0) >= activity.quota) return { ok: false, message: 'No remaining slots' }
      activity.booked = (activity.booked || 0) + 1
      this.bookings.push({ id: crypto.randomUUID(), userId, activityId, status: 'booked', createdAt: new Date().toISOString() })
      this.persist()
      return { ok: true, mode: 'book', message: 'Booked successfully' }
    },
    bookActivity(payload) { return this.toggleBooking(payload) },
    applyCareService(payload) {
      const row = { id: crypto.randomUUID(), userId: payload.userId, serviceId: payload.serviceId, name: sanitizeText(payload.name), phone: sanitizeText(payload.phone), address: sanitizeText(payload.address), visitTime: payload.visitTime, note: sanitizeText(stripDangerousTags(payload.note || '')), status: 'pending', createdAt: new Date().toISOString() }
      this.careApplications.push(row); this.remoteSet('careApplications', row); this.persist(); return { ok: true, message: 'Application submitted' }
    },
    cancelCareApplication(id, userId) {
      const index = this.careApplications.findIndex((row) => row.id === id && row.userId === userId)
      if (index < 0) return { ok: false, message: 'Application not found' }
      if (this.careApplications[index].status !== 'pending') return { ok: false, message: 'Only pending applications can be canceled' }
      this.careApplications.splice(index, 1); this.remoteDelete('careApplications', id); this.persist(); return { ok: true, message: 'Application canceled' }
    },
    submitRating({ userId, targetType, targetId, stars, comment }) {
      if (this.ratings.some((row) => row.userId === userId && row.targetType === targetType && row.targetId === targetId)) return { ok: false, message: 'You can rate this item only once' }
      const row = { id: crypto.randomUUID(), userId, targetType, targetId, stars: Number(stars), comment: sanitizeText(stripDangerousTags(comment || '')), createdAt: new Date().toISOString() }
      this.ratings.push(row); this.remoteSet('ratings', row); this.persist(); return { ok: true, message: 'Rating submitted' }
    },
    deleteRating({ userId, targetType, targetId }) {
      const index = this.ratings.findIndex((row) => row.userId === userId && row.targetType === targetType && row.targetId === targetId)
      if (index < 0) return { ok: false, message: 'Rating not found' }
      const id = this.ratings[index].id; this.ratings.splice(index, 1); this.remoteDelete('ratings', id); this.persist(); return { ok: true, message: 'Rating deleted' }
    },
    addArticle(article) { const row = { id: crypto.randomUUID(), title: sanitizeText(article.title || ''), category: sanitizeText(article.category || ''), publishedAt: article.publishedAt || new Date().toISOString().slice(0, 10), summary: sanitizeText(article.summary || ''), content: sanitizeText(stripDangerousTags(article.content || '')) }; this.articles.unshift(row); this.remoteSet('articles', row); this.persist() },
    removeArticle(id) { this.articles = this.articles.filter((row) => row.id !== id); this.remoteDelete('articles', id); this.persist() },
    deleteArticle(id) { this.removeArticle(id) },
    addActivity(payload) { const row = { id: crypto.randomUUID(), title: sanitizeText(payload.title || ''), type: sanitizeText(payload.type || ''), time: sanitizeText(payload.time || ''), location: sanitizeText(payload.location || ''), quota: Number(payload.quota || 0), booked: Number(payload.booked || 0), description: sanitizeText(stripDangerousTags(payload.description || '')) }; this.activities.unshift(row); this.remoteSet('activities', row); this.persist() },
    removeActivity(id) { this.activities = this.activities.filter((row) => row.id !== id); this.remoteDelete('activities', id); this.persist() },
    deleteActivity(id) { this.removeActivity(id) },
    addService(payload) { const row = { id: crypto.randomUUID(), name: sanitizeText(payload.name || ''), type: sanitizeText(payload.type || payload.category || ''), description: sanitizeText(stripDangerousTags(payload.description || '')) }; this.services.unshift(row); this.remoteSet('services', row); this.persist() },
    removeService(id) { this.services = this.services.filter((row) => row.id !== id); this.remoteDelete('services', id); this.persist() },
    deleteService(id) { this.removeService(id) },
    updateApplicationStatus(id, status) { const row = this.careApplications.find((item) => item.id === id); if (!row) return; row.status = status; this.remoteSet('careApplications', row); this.persist() },
  },
})
