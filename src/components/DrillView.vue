<template>
  <EarthScene :scope="{ type: 'province', adcode }" />
</template>

<script setup>
import EarthScene from './EarthScene.vue'

defineProps({
  /** 被下钻的省级行政区 adcode */
  adcode: { type: String, required: true },
})
</script>
