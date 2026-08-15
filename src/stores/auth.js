import { defineStore } from 'pinia'
import { load, save } from '@/utils/storage'
import { hashPassword, sanitizeText } from '@/utils/security'
import { firebaseAuth, firestoreDb } from '@/utils/firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

const USERS_KEY = 'silver_users'
const SESSION_KEY = 'silver_session'

function normalizePhone(v) {
  return String(v || '').trim()
}
function normalizeEmail(v) {
  return String(v || '').trim().toLowerCase()
}
function normalizeAccount(v) {
  return String(v || '').trim()
}
function isValidPhone(v) {
  return /^1\d{10}$/.test(normalizePhone(v))
}
function isValidEmail(v) {
  return normalizeEmail(v).includes('@')
}
function isAgeValidByRole(age, role) {
  const n = Number(age)
  if (!Number.isFinite(n)) return false
  if (role === 'admin-pending') return n >= 20 && n <= 60
  return n >= 60 && n <= 100
}

function ensureAdmin() {
  const users = load(USERS_KEY, [])
  if (!users.some((u) => u.role === 'admin')) {
    users.push({
      id: crypto.randomUUID(),
      phone: 'admin',
      email: 'admin@silver.local',
      passwordHash: hashPassword('Admin@123'),
      name: 'Platform Admin',
      age: 36,
      role: 'admin',
      adminApproved: true,
      approvedBy: null,
      approvedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    })
    save(USERS_KEY, users)
  }
}

function publicUser(u) {
  if (!u) return null
  return {
    id: u.id,
    phone: u.phone,
    email: u.email,
    name: u.name,
    age: u.age,
    role: u.role,
    adminApproved: !!u.adminApproved,
    approvedBy: u.approvedBy || null,
    approvedAt: u.approvedAt || null,
    createdAt: u.createdAt
  }
}

async function syncFirestoreUser(user) {
  await setDoc(doc(firestoreDb, 'users', user.id), publicUser(user), { merge: true })
}

export const useAuthStore = defineStore('auth', {
  state: () => ({ user: null }),
  getters: {
    isLoggedIn: (s) => !!s.user,
    role: (s) => s.user?.role || 'guest',
    allUsers: () => load(USERS_KEY, [])
  },
  actions: {
    hydrate() {
      ensureAdmin()
      const session = load(SESSION_KEY, null)
      this.user = session ? publicUser(session) : null
    },

    async register(payload) {
      ensureAdmin()
      const users = load(USERS_KEY, [])

      const name = sanitizeText(payload?.name || '').trim()
      const phone = normalizePhone(payload?.phone)
      const email = normalizeEmail(payload?.email)
      const password = String(payload?.password || '')
      const age = Number(payload?.age)
      const role = payload?.role === 'admin-pending' ? 'admin-pending' : 'user'

      if (!name) return { ok: false, message: 'Name is required' }
      if (!isValidPhone(phone)) return { ok: false, message: 'Phone must start with 1 and be 11 digits' }
      if (!isValidEmail(email)) return { ok: false, message: 'Email must contain @' }
      if (!password) return { ok: false, message: 'Password is required' }
      if (!isAgeValidByRole(age, role)) {
        return {
          ok: false,
          message: role === 'admin-pending'
            ? 'Admin age must be between 20 and 60'
            : 'Elderly user age must be between 60 and 100'
        }
      }

      if (users.some((u) => normalizePhone(u.phone) === phone)) {
        return { ok: false, message: 'Phone already registered' }
      }
      const existingUser = users.find((u) => normalizeEmail(u.email) === email)
      if (existingUser) {
        try {
          const credential = await signInWithEmailAndPassword(firebaseAuth, email, password)
          const profileRef = doc(firestoreDb, 'users', credential.user.uid)
          const profile = await getDoc(profileRef)
          if (profile.exists()) return { ok: false, message: 'Email already registered' }
          existingUser.id = credential.user.uid
          await syncFirestoreUser(existingUser)
          save(USERS_KEY, users)
          return { ok: true, user: publicUser(existingUser) }
        } catch {
          return { ok: false, message: 'Email already registered. Use the original password or choose another email.' }
        }
      }

      let credential
      try {
        credential = await createUserWithEmailAndPassword(firebaseAuth, email, password)
      } catch (e) {
        const code = e?.code || ''
        if (code === 'auth/email-already-in-use') {
          try {
            credential = await signInWithEmailAndPassword(firebaseAuth, email, password)
            const profile = await getDoc(doc(firestoreDb, 'users', credential.user.uid))
            if (profile.exists()) return { ok: false, message: 'Email already registered' }
          } catch {
            return { ok: false, message: 'Email already registered in Firebase. Use the original password or choose another email.' }
          }
        } else {
          if (code === 'auth/invalid-email') return { ok: false, message: 'Invalid email format for external authentication' }
          if (code === 'auth/weak-password') return { ok: false, message: 'External authentication requires a stronger password' }
          return { ok: false, message: code || e?.message || 'External authentication registration failed' }
        }
      }

      const user = {
        id: credential.user.uid,
        name,
        age,
        phone,
        email,
        passwordHash: hashPassword(password),
        role,
        adminApproved: role === 'admin',
        approvedBy: null,
        approvedAt: null,
        createdAt: new Date().toISOString()
      }

      users.push(user)
      save(USERS_KEY, users)
      try {
        await syncFirestoreUser(user)
      } catch (e) {
        return { ok: false, message: e?.message || 'Firestore profile creation failed' }
      }
      return { ok: true, user: publicUser(user) }
    },

    async login({ account, phone, password }) {
      ensureAdmin()
      const users = load(USERS_KEY, [])

      const rawAccount = normalizeAccount(account || phone)
      const pwd = String(password || '')
      const isEmailInput = rawAccount.includes('@')
      const accountNorm = isEmailInput ? normalizeEmail(rawAccount) : rawAccount

      const hit = users.find((u) => {
        const byPhone = normalizePhone(u.phone) === rawAccount
        const byEmail = normalizeEmail(u.email) === accountNorm
        return isEmailInput ? byEmail : (byPhone || byEmail)
      })

      if (!hit) return { ok: false, message: 'Account not found' }
      if (hit.passwordHash !== hashPassword(pwd)) return { ok: false, message: 'Incorrect password' }
      const legacyId = hit.id

      if (!isValidEmail(hit.email) || hit.email.endsWith('@silver.local')) {
        const pu = publicUser(hit)
        this.user = pu
        save(SESSION_KEY, pu)
        return { ok: true, user: pu, localOnly: true }
      }

      try {
        const credential = await signInWithEmailAndPassword(firebaseAuth, hit.email, pwd)
        hit.id = credential.user.uid
        const index = users.findIndex((u) => normalizeEmail(u.email) === normalizeEmail(hit.email))
        users[index] = hit
        save(USERS_KEY, users)
        await syncFirestoreUser(hit)
      } catch (e) {
        return { ok: false, message: e?.code === 'auth/invalid-credential' ? 'Firebase password does not match this account' : (e?.message || 'Firebase login failed') }
      }

      const pu = publicUser(hit)
      this.user = pu
      save(SESSION_KEY, pu)
      return { ok: true, user: pu, legacyId }
    },

    async loginWithFirebase({ email, password }) {
      ensureAdmin()
      const em = normalizeEmail(email)
      const pwd = String(password || '')

      if (!isValidEmail(em)) return { ok: false, message: 'Valid email is required for Firebase login' }
      if (!pwd) return { ok: false, message: 'Password is required' }

      try {
        const cred = await signInWithEmailAndPassword(firebaseAuth, em, pwd)
        const fbEmail = normalizeEmail(cred?.user?.email || em)

        const users = load(USERS_KEY, [])
        let hit = users.find((u) => normalizeEmail(u.email) === fbEmail)
        const legacyId = hit?.id || null

        if (!hit) {
          hit = {
            id: cred.user.uid,
            name: 'Firebase User',
            age: 60,
            phone: '',
            email: fbEmail,
            passwordHash: hashPassword(pwd),
            role: 'user',
            adminApproved: false,
            approvedBy: null,
            approvedAt: null,
            createdAt: new Date().toISOString()
          }
          users.push(hit)
          save(USERS_KEY, users)
        }

        hit.id = cred.user.uid
        try {
          const profile = await getDoc(doc(firestoreDb, 'users', hit.id))
          if (profile.exists()) Object.assign(hit, profile.data())
          else await syncFirestoreUser(hit)
        } catch (e) {
          return { ok: false, message: e?.message || 'Firestore profile loading failed' }
        }
        const pu = publicUser(hit)
        this.user = pu
        save(SESSION_KEY, pu)
        return { ok: true, user: pu, legacyId }
      } catch (e) {
        const code = e?.code || ''
        if (code === 'auth/user-not-found') return { ok: false, message: 'Firebase account not found' }
        if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') return { ok: false, message: 'Incorrect Firebase password' }
        if (code === 'auth/invalid-email') return { ok: false, message: 'Invalid email format for Firebase login' }
        return { ok: false, message: code || e?.message || 'Firebase login failed' }
      }
    },

    logout() {
      this.user = null
      save(SESSION_KEY, null)
      signOut(firebaseAuth).catch(() => {})
    },

    approveAdmin(userId) {
      if (!this.user || this.user.role !== 'admin') {
        return { ok: false, message: 'No permission' }
      }

      const users = load(USERS_KEY, [])
      const idx = users.findIndex((u) => u.id === userId)
      if (idx < 0) return { ok: false, message: 'User not found' }

      const target = users[idx]
      if (target.role !== 'admin-pending') {
        return { ok: false, message: 'This account is not a pending admin account' }
      }

      target.role = 'admin'
      target.adminApproved = true
      target.approvedBy = this.user.id
      target.approvedAt = new Date().toISOString()

      users[idx] = target
      save(USERS_KEY, users)
      if (firebaseAuth.currentUser) updateDoc(doc(firestoreDb, 'users', userId), publicUser(target)).catch(() => {})
      return { ok: true, message: 'Approved successfully' }
    },

    rejectAdmin(userId) {
      if (!this.user || this.user.role !== 'admin') {
        return { ok: false, message: 'No permission' }
      }

      const users = load(USERS_KEY, [])
      const idx = users.findIndex((u) => u.id === userId)
      if (idx < 0) return { ok: false, message: 'User not found' }

      const target = users[idx]
      if (target.role !== 'admin-pending') {
        return { ok: false, message: 'This account is not a pending admin account' }
      }

      target.role = 'user'
      target.adminApproved = false
      target.approvedBy = null
      target.approvedAt = null

      users[idx] = target
      save(USERS_KEY, users)
      if (firebaseAuth.currentUser) updateDoc(doc(firestoreDb, 'users', userId), publicUser(target)).catch(() => {})
      return { ok: true, message: 'Rejected and changed to standard user' }
    },

    async resetPassword({ name, account, newPassword }) {
      ensureAdmin()
      const users = load(USERS_KEY, [])

      const n = sanitizeText(name || '').trim().toLowerCase()
      const aRaw = normalizeAccount(account)
      const aEmail = normalizeEmail(account)
      const p = String(newPassword || '')

      if (!n) return { ok: false, message: 'Name is required' }
      if (!aRaw) return { ok: false, message: 'Account is required' }
      if (!p) return { ok: false, message: 'New password is required' }

      const isPhoneInput = isValidPhone(aRaw)
      const isEmailInput = isValidEmail(aRaw)
      if (!isPhoneInput && !isEmailInput) {
        return { ok: false, message: 'Account must be a phone number (11 digits starting with 1) or an email' }
      }

      const idx = users.findIndex((u) => {
        const sameName = String(u.name || '').trim().toLowerCase() === n
        if (!sameName) return false
        if (isPhoneInput) return normalizePhone(u.phone) === aRaw
        return normalizeEmail(u.email) === aEmail
      })

      if (idx < 0) return { ok: false, message: 'No matching user found' }

      users[idx].passwordHash = hashPassword(p)
      save(USERS_KEY, users)

      if (this.user && this.user.id === users[idx].id) {
        this.user = publicUser(users[idx])
        save(SESSION_KEY, this.user)
      }

      return { ok: true, message: 'Password reset successful' }
    }
  }
})
