<script setup>
import { computed, onMounted } from 'vue'
import { useAppDataStore } from '@/stores/appData'
import CommunityMap from '@/components/common/CommunityMap.vue'
import ActivityBookingCalendar from '@/components/common/ActivityBookingCalendar.vue'
import HealthAiAssistant from '@/components/common/HealthAiAssistant.vue'

const data = useAppDataStore()
onMounted(() => data.hydrate())

const recActs = computed(() => data.activities.slice(0, 4))
const tips = computed(() => data.articles.slice(0, 4))
</script>

<template>
  <section class="home-wrap card">
    <div class="hero grid-2">
      <div class="hero-left">
        <h1>Welcome!</h1>
        <p>Easy Services for Elderly Health and Care.</p>

        <HealthAiAssistant />
      </div>

      <div class="hero-right">
        <ActivityBookingCalendar />
      </div>
    </div>

    <div class="apps-block">
      <h2>Main Applications</h2>
      <div class="apps-row">
        <router-link class="app-btn" to="/health"><span>Health Knowledge</span></router-link>
        <router-link class="app-btn" to="/activities"><span>Public Activities</span></router-link>
        <router-link class="app-btn" to="/care"><span>Apply for Care</span></router-link>
        <router-link class="app-btn" to="/me"><span>My Appointments</span></router-link>
      </div>
    </div>

    <div class="bottom grid-2">
      <div class="card">
        <h3>Recommended Activities</h3>
        <ul>
          <li v-for="a in recActs" :key="a.id">{{ a.title }}</li>
        </ul>
      </div>
      <div class="card">
        <h3>Health Tips</h3>
        <ul>
          <li v-for="t in tips" :key="t.id">{{ t.title }}</li>
        </ul>
      </div>
    </div>

    <CommunityMap />
  </section>
</template>

<style scoped>
.home-wrap { padding: 0; overflow: hidden; }
.hero { padding: 28px; background: #fff; }
.hero-left h1 { margin: 0 0 8px; }
.hero-right { display: flex; align-items: center; justify-content: center; }

.apps-block { background: #d1d5db; padding: 22px; text-align: center; }
.apps-row {
  display: flex;
  gap: 22px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 12px;
}

.app-btn {
  width: 190px;
  height: 72px;
  min-width: 190px;
  min-height: 72px;
  max-width: 190px;
  max-height: 72px;

  border-radius: 999px;
  background: #374151;
  color: #fff;
  text-decoration: none;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;

  padding: 0 14px;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
  text-align: center;
  white-space: normal;
  overflow: hidden;
}

.app-btn > span {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.2;
}

.bottom { padding: 20px; background: #fff; }
ul { margin: 8px 0 0; padding-left: 18px; }
li { margin: 8px 0; }

@media (min-width: 576px) and (max-width: 768px) {
  .apps-row {
    display: grid;
    grid-template-columns: repeat(2, 190px);
    justify-content: center;
    justify-items: center;
    column-gap: 22px;
    row-gap: 14px;
  }
}

@media (max-width: 768px) {
  .apps-row { gap: 14px; }
  .app-btn {
    width: 172px;
    height: 68px;
    min-width: 172px;
    min-height: 68px;
    max-width: 172px;
    max-height: 68px;
    font-size: 15px;
  }
}
</style>
