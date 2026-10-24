<template>
  <section v-if="comp" class="learn-panel learn-demo">
    <h2 class="learn-panel__title">图解</h2>
    <component :is="comp" />
  </section>
</template>

<script setup>
/**
 * 知识点页里的「图解」区块。
 *
 * 演示的组件按 id 从注册表里取，取不到就整块不渲染——
 * 知识数据里写了一个不存在的演示 id 时，页面照常显示，只是没有图解。
 */
import { computed, defineAsyncComponent } from 'vue'
import { DEMO_LOADERS } from '../data/demos'

const props = defineProps({
  /** 演示 id，取自知识数据里的 demos 字段 */
  id: { type: String, default: '' },
})

const comp = computed(() => {
  const loader = DEMO_LOADERS[props.id]
  return loader ? defineAsyncComponent(loader) : null
})
</script>
