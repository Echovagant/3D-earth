<template>
  <div v-if="visible" class="scenic-gallery" tabindex="0" @keydown="onKeydown">
    <button
      type="button"
      class="scenic-gallery__main"
      :aria-label="`放大${name}的图片`"
      @click="openLightbox"
    >
      <Transition name="scenic-swap">
        <img
          :key="current.file"
          class="scenic-gallery__image"
          :src="scenicImagePath(current.file)"
          :alt="`${name}的风景`"
          width="960"
          height="600"
        />
      </Transition>
      <span class="scenic-gallery__zoom" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
        >
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M15.5 15.5 21 21M10.5 7.5v6M7.5 10.5h6" stroke-linecap="round" />
        </svg>
      </span>
    </button>

    <div class="scenic-gallery__thumbs" role="group" aria-label="图片列表">
      <!-- 只遍历过滤后的列表：清单里可能有还没落盘的候选（file 为空），
           遍历原始 prop 会渲染出空 src 的破图 -->
      <button
        v-for="(image, i) in visibleImages"
        :key="image.file"
        type="button"
        class="scenic-gallery__thumb"
        :class="{ 'scenic-gallery__thumb--current': i === index }"
        :aria-current="i === index ? 'true' : undefined"
        :aria-label="`第 ${i + 1} 张`"
        @click="goTo(i)"
      >
        <img :src="scenicImagePath(image.file)" :alt="`${name}的第 ${i + 1} 张图`" loading="lazy" />
      </button>
    </div>

    <p class="scenic-gallery__hint">← → 切图，点大图放大</p>

    <!-- 灯箱：点大图后出现，Esc 关闭，← → 切图。
         挂到 body：详情页正文容器带着入场动画留下的 transform，
         transform 祖先会把 position: fixed 降级成 absolute，灯箱盖不住全屏 -->
    <Teleport to="body">
      <div
        v-if="lightbox"
        class="scenic-lightbox"
        role="dialog"
        aria-modal="true"
        :aria-label="`${name}的图片`"
        tabindex="-1"
        ref="lightboxEl"
        @keydown="onLightboxKeydown"
      >
        <span class="scenic-lightbox__grain" aria-hidden="true"></span>

        <Transition name="scenic-reel">
          <figure :key="current.file" class="scenic-lightbox__frame">
            <img
              class="scenic-lightbox__image"
              :src="scenicImagePath(current.file)"
              :alt="`${name}的风景`"
            />
          </figure>
        </Transition>

        <button
          v-if="visibleImages.length > 1"
          type="button"
          class="scenic-lightbox__nav scenic-lightbox__nav--prev"
          aria-label="上一张"
          @click="step(-1)"
        >
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path d="M15 5 8 12l7 7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <button
          v-if="visibleImages.length > 1"
          type="button"
          class="scenic-lightbox__nav scenic-lightbox__nav--next"
          aria-label="下一张"
          @click="step(1)"
        >
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path d="m9 5 7 7-7 7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>

        <button
          type="button"
          class="scenic-lightbox__close"
          aria-label="关闭"
          @click="closeLightbox"
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path d="m6 6 12 12M18 6 6 18" stroke-linecap="round" />
          </svg>
        </button>

        <div class="scenic-lightbox__bar">
          <span class="scenic-lightbox__title">{{ name }}</span>
          <span class="scenic-lightbox__counter">{{ index + 1 }} / {{ visibleImages.length }}</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
/**
 * 景区图廊：主图 + 缩略图条，点主图开灯箱。
 *
 * 灯箱走「电影级」的路子：暗场压住背景，画面自己缓慢推近（Ken Burns），
 * 换图是带方向的交叉淡入，界面元素退到边角只在需要时浮现。
 *
 * 键盘契约：Esc 关灯箱、← → 切图；灯箱关闭后焦点回到原图按钮，
 * 否则焦点会掉到 body 上，键盘用户等于从头再来一遍。
 */
import { computed, ref, watch, onBeforeUnmount, nextTick } from 'vue'
import { scenicImagePath } from '../utils/scenic.js'

const props = defineProps({
  images: { type: Array, required: true },
  name: { type: String, default: '' },
})

const index = ref(0)
const lightbox = ref(false)
/** 开灯箱的主图按钮：关灯箱后焦点要还回去 */
const openerEl = ref(null)
const lightboxEl = ref(null)
/** 换图的方向：交叉淡入时用它决定画面往哪边让 */
const direction = ref('next')

/** 只认有文件名的图：条目在但文件没落盘时不渲染，避免出破图 */
const visibleImages = computed(() => (props.images ?? []).filter((img) => img?.file))
const visible = computed(() => visibleImages.value.length > 0)
const current = computed(() => visibleImages.value[index.value] ?? visibleImages.value[0])

const step = (delta) => {
  const total = visibleImages.value.length
  if (!total) return
  direction.value = delta > 0 ? 'next' : 'prev'
  // 到头回到另一头：一直按右键不会停在原地
  index.value = (index.value + delta + total) % total
  preload(index.value)
}

const goTo = (i) => {
  direction.value = i > index.value ? 'next' : 'prev'
  index.value = i
}

/** 预取相邻的两张：切图时不等网络 */
const preload = (i) => {
  const total = visibleImages.value.length
  if (!total) return
  for (const offset of [1, -1]) {
    const image = visibleImages.value[(i + offset + total) % total]
    if (image?.file) {
      const pre = new Image()
      pre.src = scenicImagePath(image.file)
    }
  }
}

const openLightbox = (event) => {
  openerEl.value = event?.currentTarget ?? null
  lightbox.value = true
  direction.value = 'next'
  // 背景不滚，灯箱里的图才是唯一能动的
  document.body.style.overflow = 'hidden'
  preload(index.value)
  nextTick(() => lightboxEl.value?.focus?.())
}

const closeLightbox = () => {
  lightbox.value = false
  document.body.style.overflow = ''
  // 焦点还给开灯箱的那张图
  openerEl.value?.focus?.()
  openerEl.value = null
}

const onKeydown = (event) => {
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    step(-1)
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    step(1)
  }
}

const onLightboxKeydown = (event) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeLightbox()
    return
  }
  onKeydown(event)
}

// 图片列表变了（换景区）就把序号归零，否则会停在上一个景区的第几张
watch(
  () => visibleImages.value.map((img) => img.file).join(','),
  () => {
    index.value = 0
  },
)

onBeforeUnmount(() => {
  // 卸载时别把 body 的滚动锁留下
  if (lightbox.value) document.body.style.overflow = ''
})
</script>

<style scoped>
.scenic-gallery {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.scenic-gallery:focus-visible {
  outline: 2px solid var(--learn-accent);
  outline-offset: 2px;
}

.scenic-gallery__main {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  border: 1px solid var(--learn-line);
  border-radius: var(--radius);
  background: var(--learn-panel);
  overflow: hidden;
  cursor: zoom-in;
}

/* 悬停时画面轻微推近，给一点「可以点开」的暗示 */
.scenic-gallery__image {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 8 / 5;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.scenic-gallery__main:hover .scenic-gallery__image {
  transform: scale(1.035);
}

.scenic-gallery__zoom {
  position: absolute;
  right: var(--sp-3);
  bottom: var(--sp-3);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  color: var(--learn-ink);
  background: var(--learn-panel);
  border: 1px solid var(--learn-line);
  opacity: 0;
  transform: translateY(6px);
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.scenic-gallery__main:hover .scenic-gallery__zoom,
.scenic-gallery__main:focus-visible .scenic-gallery__zoom {
  opacity: 1;
  transform: translateY(0);
}

/* 图廊里换图：淡入淡出，不横跳 */
.scenic-swap-enter-active,
.scenic-swap-leave-active {
  transition: opacity 0.35s ease;
}

.scenic-swap-enter-from,
.scenic-swap-leave-to {
  opacity: 0;
}

.scenic-gallery__thumbs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}

.scenic-gallery__thumb {
  padding: 0;
  border: 1px solid var(--learn-line);
  border-radius: var(--radius-sm);
  background: var(--learn-panel);
  overflow: hidden;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease;
}

.scenic-gallery__thumb:hover {
  transform: translateY(-2px);
}

.scenic-gallery__thumb--current {
  border-color: var(--learn-accent);
}

.scenic-gallery__thumb img {
  display: block;
  width: 72px;
  height: 45px;
  object-fit: cover;
}

.scenic-gallery__hint {
  margin: 0;
  font-size: 12px;
  color: var(--learn-ink-faint);
}

/* ---------------- 灯箱 ---------------- */

.scenic-lightbox {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: rgba(2, 4, 10, 0.94);
  animation: scenic-lb-in 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.scenic-lightbox:focus-visible {
  outline: none;
}

/* 暗角：把视线压向画面中心 */
.scenic-lightbox::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at center, transparent 42%, rgba(0, 0, 0, 0.62) 100%);
}

/* 极轻的胶片颗粒：让纯色背景不那么「数字化」 */
.scenic-lightbox__grain {
  position: absolute;
  inset: -50%;
  pointer-events: none;
  opacity: 0.035;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E");
  animation: scenic-grain 1.1s steps(3) infinite;
}

.scenic-lightbox__frame {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  width: 100%;
  height: 100%;
  padding: clamp(16px, 4vw, 56px);
}

.scenic-lightbox__image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 2px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.55);
  /* 画面自己缓慢推近（Ken Burns）：静止的照片也有呼吸感 */
  animation: scenic-kb 22s cubic-bezier(0.16, 0.7, 0.3, 1) forwards;
}

/* 换图：带方向的交叉淡入 */
.scenic-reel-enter-active {
  transition:
    opacity 0.55s cubic-bezier(0.2, 0.7, 0.2, 1),
    transform 0.7s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.scenic-reel-leave-active {
  transition:
    opacity 0.4s ease,
    transform 0.55s cubic-bezier(0.2, 0.7, 0.2, 1);
  position: absolute;
  inset: 0;
}

.scenic-reel-enter-from {
  opacity: 0;
  transform: scale(1.03);
}

.scenic-reel-leave-to {
  opacity: 0;
  transform: scale(0.985);
}

.scenic-lightbox__nav,
.scenic-lightbox__close {
  position: absolute;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border: 1px solid transparent;
  border-radius: 50%;
  color: #eef4ff;
  background: rgba(255, 255, 255, 0.06);
  cursor: pointer;
  opacity: 0.28;
  transition:
    opacity 0.25s ease,
    background 0.25s ease,
    transform 0.25s ease;
}

.scenic-lightbox__nav:hover,
.scenic-lightbox__close:hover,
.scenic-lightbox__nav:focus-visible,
.scenic-lightbox__close:focus-visible {
  opacity: 1;
  background: rgba(255, 255, 255, 0.14);
}

.scenic-lightbox__nav--prev {
  left: clamp(8px, 2.5vw, 28px);
  top: 50%;
  transform: translateY(-50%);
}

.scenic-lightbox__nav--next {
  right: clamp(8px, 2.5vw, 28px);
  top: 50%;
  transform: translateY(-50%);
}

.scenic-lightbox__nav--prev:hover,
.scenic-lightbox__nav--next:hover {
  transform: translateY(-50%) scale(1.06);
}

.scenic-lightbox__close {
  top: clamp(10px, 2vw, 24px);
  right: clamp(10px, 2vw, 24px);
}

/* 底部信息条：淡入得比画面晚一点，像字幕落在最后 */
.scenic-lightbox__bar {
  position: absolute;
  z-index: 2;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  padding: var(--sp-4) clamp(16px, 4vw, 56px);
  color: #e8eefc;
  background: linear-gradient(180deg, transparent, rgba(2, 4, 10, 0.72));
  animation: scenic-bar-in 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) 0.18s backwards;
}

.scenic-lightbox__title {
  font-size: 15px;
  letter-spacing: 0.04em;
}

.scenic-lightbox__counter {
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  color: rgba(232, 238, 252, 0.62);
}

@keyframes scenic-lb-in {
  from {
    opacity: 0;
    backdrop-filter: blur(0);
  }
  to {
    opacity: 1;
  }
}

@keyframes scenic-kb {
  from {
    transform: scale(1.01);
  }
  to {
    transform: scale(1.07);
  }
}

@keyframes scenic-bar-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scenic-grain {
  0% {
    transform: translate(0, 0);
  }
  33% {
    transform: translate(-2%, 1.5%);
  }
  66% {
    transform: translate(1.5%, -1%);
  }
  100% {
    transform: translate(0, 0);
  }
}

/* 系统开了「减少动态效果」：画面别自己动 */
@media (prefers-reduced-motion: reduce) {
  .scenic-lightbox,
  .scenic-lightbox__grain,
  .scenic-lightbox__image,
  .scenic-lightbox__bar {
    animation: none;
  }

  .scenic-reel-enter-active,
  .scenic-reel-leave-active,
  .scenic-swap-enter-active,
  .scenic-swap-leave-active {
    transition-duration: 0.01ms;
  }

  .scenic-gallery__image,
  .scenic-gallery__main:hover .scenic-gallery__image {
    transform: none;
    transition: none;
  }
}
</style>
