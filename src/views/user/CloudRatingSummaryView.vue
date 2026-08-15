<script setup>
import CloudRatingSummaryPanel from '@/components/admin/CloudRatingSummaryPanel.vue'
</script>

<template>
  <section class="cloud-summary card">
    <h1>Cloud Rating Summary</h1>
    <CloudRatingSummaryPanel />
  </section>
</template>

<style scoped>
.cloud-summary { max-width: 760px; margin: 0 auto; }
.cloud-summary h1 { margin-top: 0; }
</style>
