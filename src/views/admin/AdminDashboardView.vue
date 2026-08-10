<template>
  <section class="wire card">
    <h2>Data Dashboard (Reserved for future development)</h2>

    <div class="kpis">
      <div class="kpi"><p>Total Users</p></div>
      <div class="kpi"><p>Activities</p></div>
      <div class="kpi"><p>Applications</p></div>
      <div class="kpi"><p>Avg Rating</p></div>
    </div>

    <div class="grid-2">
      <div class="block">
        <h4>Activity Trending Chart</h4>
        <div class="placeholder chart"></div>
      </div>
      <div class="block">
        <h4>Service Application Trend</h4>
        <div class="placeholder chart"></div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.wire h2 { margin-top: 0; }
.kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 14px; }
.kpi { border: 1px solid #d1d5db; border-radius: 10px; padding: 12px; background:#fff; min-height: 72px; display: flex; align-items: center; }
.kpi p { margin: 0; color:#6b7280; }
.block { border:1px solid #d1d5db; border-radius:10px; padding:12px; background:#fff; }
.placeholder.chart { height: 180px; background:#e5e7eb; border-radius:8px; }
@media (max-width: 900px){ .kpis{grid-template-columns: repeat(2,1fr);} }
</style>
