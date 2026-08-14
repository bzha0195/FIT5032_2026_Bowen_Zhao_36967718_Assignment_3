<script setup>
import { useId } from 'vue'
import ValidationMessage from './ValidationMessage.vue'

defineProps({
  label: String,
  modelValue: [String, Number],
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  error: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'blur'])
const inputId = useId()
const errorId = `${inputId}-error`
</script>

<template>
  <div class="form-item">
    <label class="form-label" :for="inputId">{{ label }}</label>
    <input
      class="form-control"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :id="inputId"
      :aria-invalid="!!error"
      :aria-describedby="error ? errorId : undefined"
      @input="emit('update:modelValue', $event.target.value)"
      @blur="emit('blur')"
    />
    <ValidationMessage :id="errorId" :message="error" />
  </div>
</template>
