<template>
  <footer class="site-footer">
    <div class="container footer-3">
      <a href="#">Help</a>
      <a href="#">Feedback</a>
      <a href="#">More Information</a>
    </div>
  </footer>
</template>

<style scoped>
.footer-3 {
  min-height: calc(var(--ctrl-h) + 8px);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(16px, 3vw, 44px);
  font-size: var(--fs-footer);
  font-weight: 700;
  padding: 6px 0;
}

.footer-3 a {
  color: #4b5563;
  white-space: nowrap;
}

.footer-3 a:hover {
  color: #111827;
}

@media (max-width: 768px) {
  .footer-3 {
    flex-wrap: wrap;
    gap: 12px 18px;
  }
}
</style>
