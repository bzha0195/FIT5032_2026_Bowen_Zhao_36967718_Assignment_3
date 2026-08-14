<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const mapElement = ref(null)
const routePanel = ref(null)
const status = ref('')
const nearbyKeyword = ref('elderly care service centre')
const routeStart = ref('Southeast University')
const routeEnd = ref('Nanjing First Hospital')
const nearbyResults = ref([])

let map
let placeSearch
let driving
let markers = []

function loadAmap(key, securityCode) {
  if (window.AMap) return Promise.resolve(window.AMap)
  if (window.__amapLoading) return window.__amapLoading
  window._AMapSecurityConfig = securityCode ? { securityJsCode: securityCode } : {}
  window.__amapLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}&plugin=AMap.ToolBar,AMap.PlaceSearch,AMap.Driving`
    script.async = true
    script.onload = () => resolve(window.AMap)
    script.onerror = () => reject(new Error('Unable to load the map service.'))
    document.head.appendChild(script)
  })
  return window.__amapLoading
}

function clearMarkers() {
  if (markers.length) map.remove(markers)
  markers = []
}

function showNearby(center) {
  const keyword = nearbyKeyword.value.trim()
  if (!keyword) return
  status.value = 'Searching nearby service points…'
  clearMarkers()
  placeSearch.searchNearBy(keyword, center, 5000, (resultStatus, result) => {
    if (resultStatus !== 'complete') {
      nearbyResults.value = []
      status.value = 'No nearby service points were found. Try a different keyword.'
      return
    }
    const pois = result.poiList?.pois || []
    nearbyResults.value = pois.map((poi) => ({ name: poi.name, address: poi.address || poi.pname || '', location: poi.location }))
    markers = pois.map((poi) => new window.AMap.Marker({ position: poi.location, title: poi.name }))
    map.add(markers)
    if (markers.length) map.setFitView(markers)
    status.value = `${pois.length} nearby service point${pois.length === 1 ? '' : 's'} found.`
  })
}

function findNearby() {
  if (!map || !placeSearch) return
  if (!navigator.geolocation) return showNearby(map.getCenter())
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      const position = new window.AMap.LngLat(coords.longitude, coords.latitude)
      map.setCenter(position)
      showNearby(position)
    },
    () => showNearby(map.getCenter()),
    { enableHighAccuracy: true, timeout: 8000 }
  )
}

function planRoute() {
  const start = routeStart.value.trim()
  const end = routeEnd.value.trim()
  if (!start || !end || !driving) return
  status.value = 'Planning your driving route…'
  routePanel.value.innerHTML = ''
  driving.clear()
  driving.search([{ keyword: start }, { keyword: end }], (routeStatus) => {
    status.value = routeStatus === 'complete' ? 'Route is displayed on the map.' : 'Route planning failed. Check the place names and try again.'
  })
}

function useResultAsDestination(result) {
  routeEnd.value = result.name
  planRoute()
}

onMounted(async () => {
  const key = String(import.meta.env.VITE_AMAP_KEY || '').trim()
  const securityCode = String(import.meta.env.VITE_AMAP_SECURITY_JS_CODE || '').trim()
  if (!key) {
    status.value = 'Map setup is required. Add your AMap JavaScript API key to .env.local.'
    return
  }
  try {
    const AMap = await loadAmap(key, securityCode)
    map = new AMap.Map(mapElement.value, { zoom: 12, center: [118.7969, 32.0603], resizeEnable: true })
    map.addControl(new AMap.ToolBar())
    placeSearch = new AMap.PlaceSearch({ pageSize: 8, map: false })
    driving = new AMap.Driving({ map, panel: routePanel.value, policy: 0 })
    status.value = 'Map ready. Search for a nearby public service point or plan a route.'
  } catch (error) {
    status.value = error.message || 'Unable to start the map service.'
  }
})

onBeforeUnmount(() => {
  if (map) map.destroy()
})
</script>

<template>
  <section class="map-section" aria-labelledby="community-map-title">
    <h2 id="community-map-title">Community Service Map</h2>
    <p class="map-intro">Find nearby elderly-friendly public service points and plan a driving route between two places.</p>
    <div class="map-controls">
      <form class="control-card" @submit.prevent="findNearby">
        <h3>Nearby public service points</h3>
        <label>Service keyword<input v-model="nearbyKeyword" placeholder="e.g. elderly care service centre" /></label>
        <button class="btn btn-pill-dark" type="submit">Find nearby services</button>
      </form>
      <form class="control-card" @submit.prevent="planRoute">
        <h3>Route navigation</h3>
        <label>Start<input v-model="routeStart" placeholder="Enter a start location" /></label>
        <label>Destination<input v-model="routeEnd" placeholder="Enter a destination" /></label>
        <button class="btn btn-pill-dark" type="submit">Plan driving route</button>
      </form>
    </div>
    <p id="map-help" class="map-status">Use the search and route controls above; the map updates after each request.</p>
    <p class="map-status" role="status">{{ status }}</p>
    <div ref="mapElement" class="map-canvas" tabindex="0" aria-label="Interactive community service map" aria-describedby="map-help"></div>
    <div v-if="nearbyResults.length" class="result-list">
      <h3>Nearby results</h3>
      <button v-for="result in nearbyResults" :key="`${result.name}-${result.address}`" type="button" @click="useResultAsDestination(result)">
        <strong>{{ result.name }}</strong><span>{{ result.address }}</span>
      </button>
    </div>
    <div ref="routePanel" class="route-panel" aria-live="polite"></div>
  </section>
</template>

<style scoped>
.map-section { border-top: 1px solid #e5e7eb; padding: 20px; background: #fff; }
.map-section h2 { margin: 0; }
.map-intro, .map-status { color: #4b5563; }
.map-controls { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin: 14px 0; }
.control-card { border: 1px solid #d1d5db; border-radius: 10px; padding: 14px; display: grid; gap: 9px; }
.control-card h3, .result-list h3 { margin: 0; }
.control-card label { display: grid; gap: 5px; font-weight: 700; }
.control-card input { min-height: 44px; border: 1px solid #9ca3af; border-radius: 6px; padding: 8px 10px; font: inherit; }
.control-card button { justify-self: start; }
.map-canvas { height: 420px; border: 1px solid #d1d5db; border-radius: 10px; overflow: hidden; }
.result-list { display: grid; gap: 8px; margin-top: 14px; }
.result-list button { display: grid; text-align: left; gap: 3px; background: #f8fafc; border-radius: 8px; padding: 10px; }
.result-list span { font-weight: 400; color: #4b5563; }
.route-panel { margin-top: 14px; max-height: 300px; overflow: auto; }
@media (max-width: 768px) { .map-controls { grid-template-columns: 1fr; } .map-canvas { height: 360px; } }
</style>
