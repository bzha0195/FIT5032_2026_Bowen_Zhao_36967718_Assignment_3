export function calcRatingSummary(list = []) {
  const total = list.length
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

  if (total === 0) {
    return { avg: 0, total: 0, dist, percent: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }
  }

  let sum = 0
  list.forEach((r) => {
    const s = Number(r.stars)
    if (s >= 1 && s <= 5) {
      dist[s] += 1
      sum += s
    }
  })

  const avg = Number((sum / total).toFixed(1))
  const percent = {
    1: Math.round((dist[1] / total) * 100),
    2: Math.round((dist[2] / total) * 100),
    3: Math.round((dist[3] / total) * 100),
    4: Math.round((dist[4] / total) * 100),
    5: Math.round((dist[5] / total) * 100),
  }

  return { avg, total, dist, percent }
}
