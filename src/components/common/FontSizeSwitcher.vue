<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const open = ref(false)
const rootRef = ref(null)

function toggle() {
  open.value = !open.value
}

function setSize(size) {
  ui.setFontSize(size)
  open.value = false
}

function clickOutside(e) {
  if (!rootRef.value) return
  if (!rootRef.value.contains(e.target)) open.value = false
}

onMounted(() => document.addEventListener('click', clickOutside))
onBeforeUnmount(() => document.removeEventListener('click', clickOutside))
</script>

<template>
  <div class="fs-wrap" ref="rootRef">
    <button class="pill dark fs-main" type="button" @click="toggle">
      Fontsize
    </button>

    <div v-if="open" class="fs-menu">
      <button type="button" class="fs-item" :class="{ active: ui.fontSize === 'small' }" @click="setSize('small')">A</button>
      <button type="button" class="fs-item" :class="{ active: ui.fontSize === 'medium' }" @click="setSize('medium')">A+</button>
      <button type="button" class="fs-item" :class="{ active: ui.fontSize === 'large' }" @click="setSize('large')">A++</button>
    </div>
  </div>
</template>

<style scoped>
.fs-wrap {
  position: relative;
  display: inline-block;
}
.fs-main {
  min-width: 96px;
}
.fs-menu {
  position: absolute;
  left: 0;
  top: calc(100% + 6px);
  display: flex;
  gap: 6px;
  padding: 6px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #fff;
  z-index: 20;
}
.fs-item {
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  border-radius: 999px;
  padding: 6px 10px;
  cursor: pointer;
  font-weight: 700;
}
.fs-item.active {
  background: #111827;
  color: #fff;
  border-color: #111827;
}
</style>
