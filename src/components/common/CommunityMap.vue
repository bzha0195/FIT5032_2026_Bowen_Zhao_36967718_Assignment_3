<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const mapElement = ref(null)
const status = ref('')
const nearbyKeyword = ref('elderly care service centre')
const routeStart = ref('Southeast University')
const routeEnd = ref('Nanjing First Hospital')
const nearbyResults = ref([])
const routeSteps = ref([])
const routeSummary = ref('')

let map
let markers = []
let routeSourceAdded = false
let accessToken = ''

function clearMarkers() {
  markers.forEach((marker) => marker.remove())
  markers = []
}

function formatDistance(metres) {
  return metres >= 1000 ? `${(metres / 1000).toFixed(1)} km` : `${Math.round(metres)} m`
}

function currentCenter() {
  const center = map.getCenter()
  return [center.lng, center.lat]
}

async function searchPlaces(query, proximity = currentCenter()) {
  const params = new URLSearchParams({
    q: query,
    access_token: accessToken,
    language: 'en',
    limit: '8',
    proximity: proximity.join(','),
    country: 'CN'
  })
  const response = await fetch(`https://api.mapbox.com/search/searchbox/v1/forward?${params}`)
  if (!response.ok) throw new Error('Place search is unavailable. Check your Mapbox token and account settings.')
  const data = await response.json()
  return data.features || []
}

function placeDetails(feature) {
  const properties = feature.properties || {}
  return {
    name: properties.name || properties.name_preferred || feature.text || 'Unnamed place',
    address: properties.full_address || properties.address || properties.place_formatted || '',
    coordinates: feature.geometry?.coordinates
  }
}

function fitToCoordinates(coordinates) {
  if (!coordinates.length) return
  const bounds = coordinates.reduce(
    (box, coordinate) => box.extend(coordinate),
    new mapboxgl.LngLatBounds(coordinates[0], coordinates[0])
  )
  map.fitBounds(bounds, { padding: 70, maxZoom: 14 })
}

async function showNearby(center) {
  const keyword = nearbyKeyword.value.trim()
  if (!keyword) return
  status.value = 'Searching nearby service points…'
  clearMarkers()
  try {
    const features = await searchPlaces(keyword, center)
    nearbyResults.value = features.map(placeDetails).filter((place) => place.coordinates)
    markers = nearbyResults.value.map((place) => new mapboxgl.Marker({ color: '#4169e1' })
      .setLngLat(place.coordinates)
      .setPopup(new mapboxgl.Popup({ offset: 24 }).setHTML(`<strong>${place.name}</strong><br>${place.address || ''}`))
      .addTo(map))
    if (nearbyResults.value.length) fitToCoordinates(nearbyResults.value.map((place) => place.coordinates))
    status.value = nearbyResults.value.length
      ? `${nearbyResults.value.length} nearby service point${nearbyResults.value.length === 1 ? '' : 's'} found.`
      : 'No nearby service points were found. Try a different English keyword.'
  } catch (error) {
    nearbyResults.value = []
    status.value = error.message || 'Nearby search failed.'
  }
}

function findNearby() {
  if (!map) return
  if (!navigator.geolocation) return showNearby(currentCenter())
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      const center = [coords.longitude, coords.latitude]
      map.setCenter(center)
      showNearby(center)
    },
    () => showNearby(currentCenter()),
    { enableHighAccuracy: true, timeout: 8000 }
  )
}

function drawRoute(geometry) {
  const routeData = { type: 'Feature', properties: {}, geometry }
  if (!routeSourceAdded) {
    map.addSource('driving-route', { type: 'geojson', data: routeData })
    map.addLayer({
      id: 'driving-route',
      type: 'line',
      source: 'driving-route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#f0a51a', 'line-width': 6 }
    })
    routeSourceAdded = true
  } else {
    map.getSource('driving-route').setData(routeData)
  }
  fitToCoordinates(geometry.coordinates)
}

async function planRoute() {
  const start = routeStart.value.trim()
  const end = routeEnd.value.trim()
  if (!start || !end || !map) return
  status.value = 'Planning your driving route…'
  routeSteps.value = []
  routeSummary.value = ''
  try {
    const [startFeature] = await searchPlaces(start)
    const [endFeature] = await searchPlaces(end)
    const startPlace = placeDetails(startFeature || {})
    const endPlace = placeDetails(endFeature || {})
    if (!startPlace.coordinates || !endPlace.coordinates) throw new Error('A start or destination could not be found. Try an English place name.')
    const coordinates = `${startPlace.coordinates.join(',')};${endPlace.coordinates.join(',')}`
    const params = new URLSearchParams({ access_token: accessToken, geometries: 'geojson', overview: 'full', steps: 'true', language: 'en' })
    const response = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?${params}`)
    if (!response.ok) throw new Error('Route planning is unavailable. Check your Mapbox token and account settings.')
    const data = await response.json()
    const route = data.routes?.[0]
    if (!route) throw new Error('No driving route was found for these places.')
    drawRoute(route.geometry)
    routeSteps.value = route.legs.flatMap((leg) => leg.steps).map((step) => ({
      instruction: step.maneuver?.instruction || 'Continue',
      distance: formatDistance(step.distance)
    }))
    routeSummary.value = `${formatDistance(route.distance)} · about ${Math.round(route.duration / 60)} minutes`
    status.value = 'Route is displayed on the map.'
  } catch (error) {
    status.value = error.message || 'Route planning failed. Check the place names and try again.'
  }
}

function useResultAsDestination(result) {
  routeEnd.value = result.name
  planRoute()
}

onMounted(() => {
  accessToken = String(import.meta.env.VITE_MAPBOX_TOKEN || '').trim()
  if (!accessToken) {
    status.value = 'Map setup is required. Add your Mapbox public access token to .env.local.'
    return
  }
  mapboxgl.accessToken = accessToken
  map = new mapboxgl.Map({
    container: mapElement.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [118.7969, 32.0603],
    zoom: 11,
    language: 'en'
  })
  map.addControl(new mapboxgl.NavigationControl())
  map.on('load', () => {
    status.value = 'English map ready. Search for a nearby public service point or plan a route.'
  })
  map.on('error', () => {
    if (!map.loaded()) status.value = 'Unable to load the map. Check your Mapbox public access token and allowed URLs.'
  })
})

onBeforeUnmount(() => {
  if (map) map.remove()
})
</script>

<template>
  <section class="map-section" aria-labelledby="community-map-title">
    <h2 id="community-map-title">Community Service Map</h2>
    <p class="map-intro">Find nearby elderly-friendly public service points and plan a driving route between two places.</p>
    <div class="map-controls">
      <form class="control-card" @submit.prevent="findNearby">
        <h3>Nearby public service points</h3>
        <label>Service keyword<input v-model="nearbyKeyword" placeholder="e.g. hospital or elderly care" /></label>
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
    <div v-if="routeSteps.length" class="route-panel" aria-live="polite">
      <h3>Driving directions</h3>
      <p>{{ routeSummary }}</p>
      <ol><li v-for="(step, index) in routeSteps" :key="`${step.instruction}-${index}`">{{ step.instruction }} <span>{{ step.distance }}</span></li></ol>
    </div>
  </section>
</template>

<style scoped>
.map-section { border-top: 1px solid #e5e7eb; padding: 20px; background: #fff; }
.map-section h2 { margin: 0; }
.map-intro, .map-status, .route-panel p { color: #4b5563; }
.map-controls { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin: 14px 0; }
.control-card { border: 1px solid #d1d5db; border-radius: 10px; padding: 14px; display: grid; gap: 9px; }
.control-card h3, .result-list h3, .route-panel h3 { margin: 0; }
.control-card label { display: grid; gap: 5px; font-weight: 700; }
.control-card input { min-height: 44px; border: 1px solid #9ca3af; border-radius: 6px; padding: 8px 10px; font: inherit; }
.control-card button { justify-self: start; }
.map-canvas { height: 420px; border: 1px solid #d1d5db; border-radius: 10px; overflow: hidden; }
.result-list { display: grid; gap: 8px; margin-top: 14px; }
.result-list button { display: grid; text-align: left; gap: 3px; background: #f8fafc; border-radius: 8px; padding: 10px; }
.result-list span, .route-panel li span { font-weight: 400; color: #4b5563; }
.route-panel { margin-top: 14px; max-height: 300px; overflow: auto; border: 1px solid #d1d5db; border-radius: 10px; padding: 14px; }
.route-panel ol { margin-bottom: 0; padding-left: 22px; }
.route-panel li { padding: 5px 0; }
.route-panel li span { margin-left: 8px; }
@media (max-width: 768px) { .map-controls { grid-template-columns: 1fr; } .map-canvas { height: 360px; } }
</style>
