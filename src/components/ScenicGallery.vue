<template>
  <div v-if="visible" class="scenic-gallery" tabindex="0" @keydown="onKeydown">
    <button
      type="button"
      class="scenic-gallery__main"
      :aria-label="`放大${name}的图片`"
      @click="openLightbox"
    >
      <img
        class="scenic-gallery__image"
        :src="scenicImagePath(current.file)"
        :alt="`${name}的风景`"
        width="960"
        height="600"
      />
    </button>

    <div class="scenic-gallery__thumbs" role="group" aria-label="图片列表">
      <button
        v-for="(image, i) in images"
        :key="image.file"
        type="button"
        class="scenic-gallery__thumb"
        :class="{ 'scenic-gallery__thumb--current': i === index }"
        :aria-current="i === index ? 'true' : undefined"
        :aria-label="`第 ${i + 1} 张`"
        @click="index = i"
      >
        <img :src="scenicImagePath(image.file)" :alt="`${name}的第 ${i + 1} 张图`" loading="lazy" />
      </button>
    </div>

    <p class="scenic-gallery__hint">← → 切图，点大图放大</p>

    <!-- 灯箱：点大图后出现，Esc 关闭，← → 切图 -->
    <div
      v-if="lightbox"
      class="scenic-lightbox"
      role="dialog"
      aria-modal="true"
      :aria-label="`${name}的图片`"
      tabindex="-1"
      @keydown="onLightboxKeydown"
    >
      <img
        class="scenic-lightbox__image"
        :src="scenicImagePath(current.file)"
        :alt="`${name}的风景`"
      />
      <button type="button" class="scenic-lightbox__close" aria-label="关闭" @click="closeLightbox">
        ×
      </button>
      <p class="scenic-lightbox__counter">{{ index + 1 }} / {{ images.length }}</p>
    </div>
  </div>
</template>

<script setup>
/**
 * 景区图廊：主图 + 缩略图条，点主图开灯箱。
 *
 * 键盘契约：Esc 关灯箱、← → 切图；灯箱关闭后焦点回到原图按钮，
 * 否则焦点会掉到 body 上，键盘用户等于从头再来一遍。
 */
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { scenicImagePath } from '../utils/scenic.js'

const props = defineProps({
  images: { type: Array, required: true },
  name: { type: String, default: '' },
})

const index = ref(0)
const lightbox = ref(false)
/** 开灯箱的主图按钮：关灯箱后焦点要还回去 */
const openerEl = ref(null)

/** 只认有文件名的图：条目在但文件没落盘时不渲染，避免出破图 */
const visibleImages = computed(() => (props.images ?? []).filter((img) => img?.file))
const visible = computed(() => visibleImages.value.length > 0)
const current = computed(() => visibleImages.value[index.value] ?? visibleImages.value[0])

const step = (delta) => {
  const total = visibleImages.value.length
  if (!total) return
  // 到头回到另一头：一直按右键不会停在原地
  index.value = (index.value + delta + total) % total
}

const openLightbox = (event) => {
  openerEl.value = event?.currentTarget ?? null
  lightbox.value = true
  // 背景不滚，灯箱里的图才是唯一能动的
  document.body.style.overflow = 'hidden'
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
  display: block;
  width: 100%;
  padding: 0;
  border: 1px solid var(--learn-line);
  border-radius: var(--radius);
  background: var(--learn-panel);
  overflow: hidden;
  cursor: zoom-in;
}

.scenic-gallery__image {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 8 / 5;
  object-fit: cover;
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

.scenic-lightbox {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sp-5);
  background: rgba(4, 7, 15, 0.9);
}

.scenic-lightbox:focus-visible {
  outline: 2px solid var(--learn-accent);
}

.scenic-lightbox__image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.scenic-lightbox__close {
  position: absolute;
  top: var(--sp-4);
  right: var(--sp-4);
  width: 40px;
  height: 40px;
  font-size: 24px;
  line-height: 1;
  color: var(--learn-ink);
  background: var(--learn-panel);
  border: 1px solid var(--learn-line);
  border-radius: var(--radius);
  cursor: pointer;
}

.scenic-lightbox__counter {
  position: absolute;
  left: 50%;
  bottom: var(--sp-4);
  transform: translateX(-50%);
  margin: 0;
  font-size: 13px;
  color: var(--learn-ink-soft);
}
</style>
