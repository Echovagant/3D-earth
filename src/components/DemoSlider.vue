<template>
  <div class="demo-slider">
    <label class="demo-slider__label" :for="id">{{ label }}</label>
    <input
      :id="id"
      v-model.number="inner"
      class="demo-slider__input"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :aria-label="label"
    />
    <output class="demo-slider__value" :for="id">{{ display }}</output>
  </div>
</template>

<script setup>
/**
 * 图解里的参数轴。
 *
 * 拖一下 → 参数变 → 演示的图按新参数重算。
 * **图不是预先做好的动画帧**，是每次都拿参数去几何函数里重算路径——
 * 这样参数和图形永远对得上，不会出现「动画播到一半和文字说的不一样」。
 */
import { computed, ref, useId, watch } from 'vue'

const props = defineProps({
  /** 左侧标签 */
  label: { type: String, required: true },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 1 },
  step: { type: Number, default: 0.01 },
  /** 当前值（支持 v-model） */
  modelValue: { type: Number, default: 0 },
  /** 把数值显示成什么文案 */
  format: { type: Function, default: (v) => String(v) },
})

const emit = defineEmits(['update:modelValue'])

// 一个演示页面里可能有好几个滑块，id 要分开，否则 label 会指错
const id = `demo-slider-${useId()}`

const inner = ref(props.modelValue)
watch(
  () => props.modelValue,
  (v) => {
    inner.value = v
  },
)
watch(inner, (v) => emit('update:modelValue', v))

const display = computed(() => props.format(inner.value))
</script>
