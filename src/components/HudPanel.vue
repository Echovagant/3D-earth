<template>
  <section class="hud-panel" :class="{ 'hud-panel--flush': flush }">
    <header v-if="title" class="hud-panel__head">
      <span class="hud-panel__dot"></span>
      <span class="hud-panel__title">{{ title }}</span>
      <span v-if="meta" class="hud-panel__meta mono">{{ meta }}</span>
    </header>
    <div class="hud-panel__body">
      <slot />
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  meta: { type: String, default: '' },
  /** 去掉内边距，供贴边场景使用 */
  flush: { type: Boolean, default: false },
})
</script>

<style scoped>
.hud-panel {
  position: relative;
  padding: var(--sp-3) var(--sp-4) var(--sp-4);
  background: var(--bg-panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  backdrop-filter: blur(10px) saturate(120%);
  box-shadow: var(--glow-soft);
}

/* 四角角标：HUD 的标志性装饰 */
.hud-panel::before,
.hud-panel::after {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
  border: 1px solid var(--accent);
  opacity: 0.75;
  pointer-events: none;
}
.hud-panel::before {
  top: -1px;
  left: -1px;
  border-right: none;
  border-bottom: none;
}
.hud-panel::after {
  right: -1px;
  bottom: -1px;
  border-left: none;
  border-top: none;
}

.hud-panel--flush {
  padding: 0;
}

.hud-panel__head {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin-bottom: var(--sp-3);
  padding-bottom: var(--sp-2);
  border-bottom: 1px solid var(--line-faint);
}

.hud-panel__dot {
  width: 5px;
  height: 5px;
  flex: none;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: var(--glow);
  animation: hud-pulse 2.4s var(--ease) infinite;
}

.hud-panel__title {
  font-size: var(--fs-label);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-mid);
  font-family: var(--font-mono);
}

.hud-panel__meta {
  margin-left: auto;
  font-size: var(--fs-label);
  color: var(--text-lo);
}

.hud-panel__body {
  position: relative;
}

@keyframes hud-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}
</style>
