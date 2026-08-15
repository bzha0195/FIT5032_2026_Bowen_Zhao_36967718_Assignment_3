const { onRequest } = require('firebase-functions/v2/https')
const { setGlobalOptions } = require('firebase-functions/v2')
const { defineSecret } = require('firebase-functions/params')

setGlobalOptions({ region: 'asia-east1', maxInstances: 2 })
const deepseekApiKey = defineSecret('DEEPSEEK_API_KEY')

function getAdmin() {
  const admin = require('firebase-admin')
  if (!admin.apps.length) admin.initializeApp()
  return admin
}

exports.getRatingSummary = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Only GET requests are allowed.' })

  const admin = getAdmin()
  const targetType = String(req.query.targetType || '').trim()
  const targetId = String(req.query.targetId || '').trim()
  let query = admin.firestore().collection('ratings')

  if (targetType) query = query.where('targetType', '==', targetType)
  if (targetId) query = query.where('targetId', '==', targetId)

  try {
    const snapshot = await query.get()
    const scores = snapshot.docs
      .map((doc) => Number(doc.data().stars))
      .filter((score) => Number.isFinite(score) && score >= 1 && score <= 5)
    const total = scores.length
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    scores.forEach((score) => { distribution[score]++ })
    const average = total ? Number((scores.reduce((sum, score) => sum + score, 0) / total).toFixed(1)) : 0

    return res.status(200).json({ targetType, targetId, total, average, distribution })
  } catch (error) {
    return res.status(500).json({ error: 'Unable to calculate the rating summary.', detail: error.message })
  }
})

exports.adminDeleteUser = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST requests are allowed.' })

  const authorization = String(req.headers.authorization || '')
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
  const targetUserId = String(req.body?.userId || '').trim()
  if (!token || !targetUserId) return res.status(400).json({ error: 'Administrator token and target user ID are required.' })

  try {
    const admin = getAdmin()
    const caller = await admin.auth().verifyIdToken(token)
    const callerProfile = await admin.firestore().collection('users').doc(caller.uid).get()
    if (callerProfile.data()?.role !== 'admin') return res.status(403).json({ error: 'Administrator permission is required.' })
    if (caller.uid === targetUserId) return res.status(400).json({ error: 'You cannot delete the account currently in use.' })

    const database = admin.firestore()
    const batch = database.batch()
    for (const collectionName of ['bookings', 'careApplications', 'favorites', 'ratings']) {
      const snapshot = await database.collection(collectionName).where('userId', '==', targetUserId).get()
      snapshot.docs.forEach((item) => batch.delete(item.ref))
    }
    batch.delete(database.collection('users').doc(targetUserId))
    await batch.commit()
    await admin.auth().deleteUser(targetUserId)
    return res.status(200).json({ message: 'User account and related data deleted.' })
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unable to delete the user.' })
  }
})

exports.askHealthAssistant = onRequest({ cors: true, secrets: [deepseekApiKey] }, async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST requests are allowed.' })
  const question = String(req.body?.question || '').trim()
  if (!question || question.length > 1200) return res.status(400).json({ error: 'Provide a health question of up to 1200 characters.' })

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${deepseekApiKey.value()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        temperature: 0.5,
        max_tokens: 500,
        messages: [
          { role: 'system', content: 'You are a health education assistant for older adults. Give brief, clear, practical general wellbeing information. Do not diagnose, prescribe, or replace a clinician. Advise urgent medical help for emergencies. Reply in the same language as the user.' },
          { role: 'user', content: question }
        ]
      })
    })
    const payload = await response.json()
    if (!response.ok) return res.status(response.status).json({ error: payload.error?.message || 'DeepSeek request failed.' })
    return res.status(200).json({ answer: payload.choices?.[0]?.message?.content || 'No answer was returned.' })
  } catch (error) {
    return res.status(500).json({ error: 'Unable to contact DeepSeek.', detail: error.message })
  }
})
