const { onRequest } = require('firebase-functions/v2/https')
const { setGlobalOptions } = require('firebase-functions/v2')

setGlobalOptions({ region: 'asia-east1', maxInstances: 2 })

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
