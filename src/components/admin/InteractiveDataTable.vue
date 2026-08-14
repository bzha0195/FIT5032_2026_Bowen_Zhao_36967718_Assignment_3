<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  emptyMessage: { type: String, default: 'No records found.' }
})

const filters = ref({})
const sortKey = ref('')
const sortDirection = ref('asc')
const page = ref(1)
const pageSize = 10

function valueFor(row, key) {
  const value = typeof key === 'function' ? key(row) : row[key]
  return String(value ?? '')
}

function setSort(column) {
  if (column.sortable === false) return
  if (sortKey.value === column.key) sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  else {
    sortKey.value = column.key
    sortDirection.value = 'asc'
  }
}

const filteredRows = computed(() => {
  const activeFilters = props.columns.filter((column) => filters.value[column.key]?.trim())
  const rows = props.rows.filter((row) =>
    activeFilters.every((column) =>
      valueFor(row, column.accessor || column.key).toLowerCase().includes(filters.value[column.key].trim().toLowerCase())
    )
  )

  if (!sortKey.value) return rows
  const column = props.columns.find((item) => item.key === sortKey.value)
  if (!column) return rows
  const accessor = column.accessor || column.key
  return [...rows].sort((a, b) => {
    const left = valueFor(a, accessor)
    const right = valueFor(b, accessor)
    const numericLeft = Number(left)
    const numericRight = Number(right)
    const result = Number.isFinite(numericLeft) && Number.isFinite(numericRight)
      ? numericLeft - numericRight
      : left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' })
    return sortDirection.value === 'asc' ? result : -result
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize)))
const visibleRows = computed(() => filteredRows.value.slice((page.value - 1) * pageSize, page.value * pageSize))

watch([filteredRows, totalPages], () => {
  if (page.value > totalPages.value) page.value = totalPages.value
})
</script>

<template>
  <div class="data-table-wrap">
    <div class="column-filters" aria-label="Search table columns">
      <label v-for="column in columns.filter((item) => item.searchable !== false)" :key="column.key">
        <span>{{ column.label }}</span>
        <input v-model="filters[column.key]" :placeholder="`Search ${column.label}`" @input="page = 1" />
      </label>
    </div>

    <div class="table-scroll">
      <table class="data-table">
        <thead>
          <tr>
            <th v-for="column in columns" :key="column.key">
              <button class="sort-button" type="button" :disabled="column.sortable === false" @click="setSort(column)">
                {{ column.label }}
                <span v-if="sortKey === column.key" aria-hidden="true">{{ sortDirection === 'asc' ? ' ▲' : ' ▼' }}</span>
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in visibleRows" :key="row.id">
            <td v-for="column in columns" :key="column.key">
              <slot :name="`cell-${column.key}`" :row="row">{{ valueFor(row, column.accessor || column.key) }}</slot>
            </td>
          </tr>
          <tr v-if="visibleRows.length === 0">
            <td :colspan="columns.length" class="empty">{{ emptyMessage }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <span>{{ filteredRows.length }} record{{ filteredRows.length === 1 ? '' : 's' }} · 10 per page</span>
      <div>
        <button type="button" :disabled="page === 1" @click="page--">Previous</button>
        <span>Page {{ page }} of {{ totalPages }}</span>
        <button type="button" :disabled="page === totalPages" @click="page++">Next</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.data-table-wrap { display: grid; gap: 12px; }
.column-filters { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; }
.column-filters label { display: grid; gap: 4px; color: #475569; font-size: .85rem; }
.column-filters input { width: 100%; height: 36px; border: 1px solid #cbd5e1; border-radius: 7px; padding: 0 9px; }
.table-scroll { overflow-x: auto; border: 1px solid #e5e7eb; border-radius: 8px; }
.data-table { width: 100%; min-width: 700px; border-collapse: collapse; }
.data-table th, .data-table td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: left; vertical-align: middle; }
.data-table th { background: #f8fafc; white-space: nowrap; }
.sort-button { border: 0; background: transparent; color: inherit; font: inherit; font-weight: 700; padding: 0; cursor: pointer; text-align: left; }
.sort-button:hover:not(:disabled) { color: #1d4ed8; }
.sort-button:disabled { opacity: 1; cursor: default; }
.data-table tbody tr:last-child td { border-bottom: 0; }
.empty { text-align: center !important; color: #64748b; }
.pagination { display: flex; justify-content: space-between; align-items: center; gap: 10px; color: #64748b; font-size: .9rem; flex-wrap: wrap; }
.pagination div { display: flex; align-items: center; gap: 8px; }
.pagination button { min-height: 34px; border: 1px solid #cbd5e1; background: #fff; border-radius: 7px; padding: 0 10px; cursor: pointer; }
.pagination button:disabled { cursor: not-allowed; opacity: .5; }
</style>
