<script setup>
const props = defineProps({
  modelValue: { type: Number, default: 0 },
  readonly: { type: Boolean, default: false },
  max: { type: Number, default: 5 },
})

const emit = defineEmits(['update:modelValue'])

function setStar(n) {
  if (props.readonly) return
  emit('update:modelValue', props.modelValue === n ? 0 : n)
}
</script>

<template>
  <div class="star-rating" role="radiogroup" aria-label="Star rating">
    <button
      v-for="n in max"
      :key="n"
      type="button"
      class="star-btn"
      :class="{ active: n <= modelValue, readonly: readonly }"
      :aria-checked="n === modelValue"
      :aria-label="`${n} star`"
      :disabled="readonly"
      @click="setStar(n)"
    >
      <span class="star-char">★</span>
    </button>
  </div>
</template>

<style scoped>
.star-rating {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.star-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid #111827;
  border-radius: 6px;
  background: #ffffff;
  color: #111827;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  vertical-align: middle;
}

.star-char {
  display: block;
  font-size: 18px;
  line-height: 1;
  transform: translateY(-0.5px);
}

.star-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.star-btn.active {
  background: #111827;
  color: #ffffff;
}

.star-btn.readonly {
  cursor: default;
  opacity: 0.9;
}

.star-btn:disabled {
  cursor: not-allowed;
}
</style>
