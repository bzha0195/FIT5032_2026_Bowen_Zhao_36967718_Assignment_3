<script setup>
defineProps({ message: { type: String, default: '' } })
</script>

<template>
  <p v-if="message" class="error-text">{{ message }}</p>
</template>
