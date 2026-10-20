<template>
  <HudPanel class="legend" :title="collapsed ? '图例' : '省级行政区'" :meta="`${items.length}`">
    <button
      v-if="!collapsed"
      class="legend__search"
      type="button"
      @click="searching = !searching"
    >
      <span class="legend__search-icon">⌕</span>
      <span v-if="searching" class="legend__search-input">{{ keyword || '过滤…' }}</span>
      <span v-else>过滤</span>
    </button>

    <div v-if="!collapsed" class="legend__body">
      <p v-if="!grouped.length" class="legend__empty">无匹配项</p>
      <div v-for="group in grouped" :key="group.key" class="legend__group">
        <div class="legend__group-label">{{ group.label }}</div>
        <ul class="legend__list">
          <li
            v-for="item in group.items"
            :key="item.adcode"
            class="legend__item"
            :class="{ 'is-active': item.adcode === active }"
            @mouseenter="$emit('hover', item.adcode)"
            @mouseleave="$emit('hover', null)"
          >
            <span class="legend__swatch" :style="{ background: item.color }"></span>
            <span class="legend__name">{{ item.name }}</span>
            <span class="legend__code mono">{{ item.adcode }}</span>
          </li>
        </ul>
      </div>
    </div>

    <button class="legend__toggle" type="button" @click="collapsed = !collapsed">
      {{ collapsed ? '展开' : '收起' }}
    </button>
  </HudPanel>
</template>

<script setup>
import { computed, ref } from 'vue'
import HudPanel from './HudPanel.vue'
import { groupByRegion } from '../utils/provinceColors'

const props = defineProps({
  /** Array<{ adcode: string, name: string, color: string }> */
  items: { type: Array, required: true },
  /** 当前在球面上悬停的 adcode */
  active: { type: String, default: '' },
})

defineEmits(['hover'])

const collapsed = ref(false)
const searching = ref(false)
const keyword = ref('')

const grouped = computed(() => {
  const list = keyword.value
    ? props.items.filter((item) => item.name.includes(keyword.value))
    : props.items
  return groupByRegion(list)
})
</script>

<style scoped>
.legend {
  width: 208px;
}

.legend__body {
  position: relative;
  max-height: 58vh;
  overflow-y: auto;
  margin: 0 calc(var(--sp-2) * -1) calc(var(--sp-2) * -1);
  padding: 0 var(--sp-2) var(--sp-2);
  /* 底部渐隐，提示还有更多内容可滚动 */
  mask-image: linear-gradient(180deg, #000 0, #000 calc(100% - 22px), transparent 100%);
  -webkit-mask-image: linear-gradient(180deg, #000 0, #000 calc(100% - 22px), transparent 100%);
}

.legend__empty {
  margin: var(--sp-2) 0;
  font-size: var(--fs-label);
  color: var(--text-lo);
}

.legend__group + .legend__group {
  margin-top: var(--sp-3);
}

.legend__group-label {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin-bottom: var(--sp-1);
  font-size: var(--fs-label);
  letter-spacing: 0.14em;
  color: var(--accent);
  opacity: 0.85;
}

.legend__group-label::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, var(--line-strong), transparent);
}

.legend__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.legend__item {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: 2px var(--sp-1);
  border-radius: var(--radius-sm);
  cursor: default;
  transition: background var(--dur-fast) var(--ease);
}

.legend__item:hover,
.legend__item.is-active {
  background: var(--accent-dim);
}

.legend__swatch {
  width: 8px;
  height: 8px;
  flex: none;
  border-radius: 1px;
  box-shadow: 0 0 6px currentColor;
}

.legend__name {
  flex: 1;
  color: var(--text-mid);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.legend__item.is-active .legend__name,
.legend__item:hover .legend__name {
  color: var(--text-hi);
}

.legend__code {
  font-size: var(--fs-label);
  color: var(--text-lo);
  opacity: 0;
  transition: opacity var(--dur-fast) var(--ease);
}

.legend__item.is-active .legend__code,
.legend__item:hover .legend__code {
  opacity: 1;
}

.legend__search {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  width: 100%;
  margin-bottom: var(--sp-3);
  padding: var(--sp-1) var(--sp-2);
  border: 1px solid var(--line-faint);
  border-radius: var(--radius-sm);
  background: rgba(0, 0, 0, 0.25);
  color: var(--text-lo);
  font-size: var(--fs-label);
  font-family: var(--font-mono);
  letter-spacing: 0.1em;
  cursor: pointer;
}

.legend__search:hover {
  border-color: var(--line);
  color: var(--text-mid);
}

.legend__search-icon {
  color: var(--accent);
}

.legend__search-input {
  color: var(--text-hi);
}

.legend__toggle {
  width: 100%;
  margin-top: var(--sp-2);
  padding: var(--sp-1);
  border: 1px solid var(--line-faint);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-lo);
  font-size: var(--fs-label);
  font-family: var(--font-mono);
  letter-spacing: 0.14em;
  cursor: pointer;
  transition: color var(--dur-fast) var(--ease);
}

.legend__toggle:hover {
  color: var(--accent);
}
</style>
