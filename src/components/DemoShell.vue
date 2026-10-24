<template>
  <div class="demo" @keydown="onKey">
    <svg
      class="demo__canvas"
      :class="`demo__canvas--${direction}`"
      :viewBox="viewBox"
      role="img"
      :aria-label="current.title"
    >
      <!-- 演示自己画每一步的图，用 v-show 按 step 切换 -->
      <slot :step="step" :playing="playing" />
    </svg>

    <!-- 参数轴：HTML 控件，不能放进 SVG，所以单开一个槽 -->
    <div v-if="$slots.controls" class="demo__params">
      <slot name="controls" :step="step" :playing="playing" />
    </div>

    <p class="demo__title">{{ current.title }}</p>
    <p class="demo__text">{{ current.text }}</p>

    <p class="demo__controls">
      <button type="button" class="learn-top__back" :disabled="step === 0" @click="prev">上一步</button>

      <button
        type="button"
        class="learn-top__back demo__play"
        :aria-label="playing ? '暂停' : '播放'"
        @click="toggle"
      >
        {{ playing ? '暂停' : '播放' }}
      </button>

      <button
        type="button"
        class="learn-top__back"
        :disabled="step === steps.length - 1 && !loop"
        @click="next"
      >
        下一步
      </button>

      <button
        type="button"
        class="learn-top__back demo__speed"
        :aria-label="`${speed}× · 播放速度`"
        @click="cycleSpeed"
      >
        {{ speed }}×
      </button>

      <button
        type="button"
        class="learn-top__back demo__loop"
        :class="{ 'is-on': loop }"
        :aria-pressed="loop"
        aria-label="循环播放"
        @click="loop = !loop"
      >
        循环
      </button>

      <!-- 时间轴：点一段跳到那一步 -->
      <span class="demo__timeline" role="group" aria-label="图解步骤">
        <button
          v-for="(s, i) in steps"
          :key="s.id"
          type="button"
          class="demo__seg"
          :class="{ 'is-on': i === step, 'is-done': i < step }"
          :title="`第 ${i + 1} 步：${s.title}`"
          :aria-label="`第 ${i + 1} 步：${s.title}`"
          @click="goTo(i)"
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
 * 每个演示只管画图，步骤推进、解说文案的位置、控件样式都在这里。
 * 十几个演示共用一套外壳，不要各抄一遍。
 *
 * 播放控制：点了「播放」才自动步进，默认不自动播——
 * 页面自己动起来会抢走正在读题的人的注意力。
 * 系统开了「减少动态效果」时不自动播。
 *
 * 键盘：← → 翻步、空格播放/暂停。焦点在输入框里时不拦。
 *
 * 用法：
 *   <DemoShell :steps="steps">
 *     <template #default="{ step }">
 *       <g v-show="step === 0">…第一步的图…</g>
 *       <g v-show="step === 1">…第二步的图…</g>
 *     </template>
 *   </DemoShell>
 *
 * 需要参数轴时用具名槽（槽里是 HTML，不是 SVG）：
 *   <DemoShell :steps="steps">
 *     <template #controls="{ step }">
 *       <DemoSlider v-if="step === 3" v-model="delta" label="直射点纬度" />
 *     </template>
 *   </DemoShell>
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  /** 每一步：{ id, title, text } */
  steps: { type: Array, required: true },
  /** 画布尺寸 */
  viewBox: { type: String, default: '0 0 720 380' },
  /** 自动播放时每步停留的毫秒数 */
  dwell: { type: Number, default: 4500 },
})

const step = ref(0)
const playing = ref(false)
const loop = ref(false)
const speed = ref(1)
/** 翻页方向：新的一步从左边还是右边滑入 */
const direction = ref('forward')

const current = computed(() => props.steps[step.value])
const SPEEDS = [0.5, 1, 2]

/** 系统开了「减少动态效果」就别自己动 */
const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

let timer = null

const stopTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const startTimer = () => {
  stopTimer()
  timer = setInterval(() => {
    if (step.value >= props.steps.length - 1) {
      if (!loop.value) {
        playing.value = false
        stopTimer()
        return
      }
      goTo(0)
      return
    }
    goTo(step.value + 1)
  }, props.dwell / speed.value)
}

const goTo = (i) => {
  const next = Math.max(0, Math.min(props.steps.length - 1, i))
  if (next === step.value) return
  direction.value = next > step.value ? 'forward' : 'back'
  step.value = next
}

const next = () => goTo(step.value + 1)
const prev = () => goTo(step.value - 1)

const toggle = () => {
  // 已经在最后一步又点了播放：像播放器那样从头再来，
  // 否则一点「播放」就立刻停住，看着像按钮坏了。
  if (!playing.value && !loop.value && step.value >= props.steps.length - 1) {
    direction.value = 'back'
    step.value = 0
  }
  playing.value = !playing.value
}

const cycleSpeed = () => {
  const i = SPEEDS.indexOf(speed.value)
  speed.value = SPEEDS[(i + 1) % SPEEDS.length]
  // 速度变了，间隔要跟着换
  if (playing.value) startTimer()
}

const onKey = (event) => {
  const tag = event.target?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
  if (event.target?.isContentEditable) return
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    next()
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    prev()
  } else if (event.key === ' ') {
    event.preventDefault()
    toggle()
  }
}

watch(playing, (on) => {
  if (on && prefersReducedMotion()) {
    playing.value = false
    return
  }
  if (on) startTimer()
  else stopTimer()
})

watch(speed, () => {
  if (playing.value) startTimer()
})

onBeforeUnmount(stopTimer)
</script>
