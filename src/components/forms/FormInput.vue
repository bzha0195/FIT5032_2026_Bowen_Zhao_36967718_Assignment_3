<script setup>
import ValidationMessage from './ValidationMessage.vue'

defineProps({
  label: String,
  modelValue: [String, Number],
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  error: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'blur'])
</script>

<template>
  <div class="form-item">
    <label class="form-label">{{ label }}</label>
    <input
      class="form-control"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      @input="emit('update:modelValue', $event.target.value)"
      @blur="emit('blur')"
    />
    <ValidationMessage :message="error" />
  </div>
</template>
