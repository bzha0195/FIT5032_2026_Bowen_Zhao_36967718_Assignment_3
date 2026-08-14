<script setup>
defineProps({ message: { type: String, default: '' } })
</script>

<template>
  <p v-if="message" class="error-text" role="alert">{{ message }}</p>
</template>
