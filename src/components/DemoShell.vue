<template>
  <div class="demo">
    <svg
      class="demo__canvas"
      :viewBox="viewBox"
      role="img"
      :aria-label="current.title"
    >
      <!-- 演示自己画每一步的图，用 v-show 按 step 切换 -->
      <slot :step="step" />
    </svg>

    <p class="demo__title">{{ current.title }}</p>
    <p class="demo__text">{{ current.text }}</p>

    <p class="demo__controls">
      <button type="button" class="learn-top__back" :disabled="step === 0" @click="prev">
        上一步
      </button>
      <button
        type="button"
        class="learn-top__back"
        :disabled="step === steps.length - 1"
        @click="next"
      >
        下一步
      </button>
      <button type="button" class="learn-top__back" @click="replay">重播</button>
      <span class="demo__dots" role="group" aria-label="图解步骤">
        <button
          v-for="(s, i) in steps"
          :key="s.id"
          type="button"
          class="demo__dot"
          :class="{ 'demo__dot--on': i === step }"
          :aria-current="i === step ? 'step' : undefined"
          :aria-label="`第 ${i + 1} 步：${s.title}`"
          @click="step = i"
        ></button>
      </span>
      <span class="demo__count">{{ step + 1 }} / {{ steps.length }}</span>
    </p>
  </div>
</template>

<script setup>
/**
 * 演示的外壳：画布 + 当前步骤的解说 + 步骤控件。
 *
 * 每个演示只管画图，步骤推进、解说文案的位置、控件样式都在这里——
 * 十几个演示共用一套外壳，不要各抄一遍。
 *
 * 用法：
 *   <DemoShell :steps="steps">
 *     <template #default="{ step }">
 *       <g v-show="step === 0">…第一步的图…</g>
 *       <g v-show="step === 1">…第二步的图…</g>
 *     </template>
 *   </DemoShell>
 */
import { computed, ref } from 'vue'

const props = defineProps({
  /** 每一步：{ id, title, text } */
  steps: { type: Array, required: true },
  /** 画布尺寸 */
  viewBox: { type: String, default: '0 0 720 380' },
})

const step = ref(0)
const current = computed(() => props.steps[step.value])
const next = () => {
  if (step.value < props.steps.length - 1) step.value += 1
}
const prev = () => {
  if (step.value > 0) step.value -= 1
}
const replay = () => {
  step.value = 0
}
</script>
