<template>
  <div class="legend">
    <div class="legend__title">省级行政区</div>
    <ul class="legend__list">
      <li v-for="item in items" :key="item.adcode" class="legend__item">
        <span class="legend__swatch" :style="{ background: item.color }"></span>
        <span class="legend__name">{{ item.name }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
defineProps({
  /** Array<{ adcode: string, name: string, color: string }> */
  items: { type: Array, required: true },
})
</script>

<style scoped>
.legend {
  position: absolute;
  top: 16px;
  right: 16px;
  max-height: 78vh;
  overflow-y: auto;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(8, 18, 34, 0.68);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #e8eefc;
  font-size: 12px;
  line-height: 1.5;
  backdrop-filter: blur(6px);
}
.legend__title {
  margin-bottom: 8px;
  font-weight: 600;
  letter-spacing: 0.08em;
}
.legend__list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.legend__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
  white-space: nowrap;
}
.legend__swatch {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  flex: none;
}
.legend__name {
  opacity: 0.92;
}
</style>
