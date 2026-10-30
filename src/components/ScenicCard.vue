<template>
  <router-link class="scenic-card" :to="`/scenic/${adcode}/${scenic.id}`">
    <span class="scenic-card__thumb">
      <img
        v-if="cover"
        class="scenic-card__img"
        :src="scenicImagePath(cover.file)"
        :alt="`${scenic.name}的风景`"
        loading="lazy"
        width="320"
        height="200"
      />
      <span v-else class="scenic-card__placeholder" aria-hidden="true" :style="placeholderStyle">
        {{ scenic.name.slice(0, 1) }}
      </span>
    </span>
    <span class="scenic-card__body">
      <span class="scenic-card__head">
        <span class="scenic-card__name">{{ scenic.name }}</span>
        <span v-if="scenic.level" class="scenic-card__level">{{ scenic.level }}</span>
      </span>
      <span class="scenic-card__summary">{{ oneLine }}</span>
    </span>
  </router-link>
</template>

<script setup>
/**
 * 景区卡片：省详情页与知识点页共用。
 *
 * 没抓到图时不留破图，用省色渐变加名称首字占位——省色与地球上是同一个
 * 来源（provinceColors 的稳定映射），用户从球面点到卡片看到的是同一个颜色。
 */
import { computed } from 'vue'
import { scenicImagePath } from '../utils/scenic.js'
import { getProvinceColor, toHexString } from '../utils/provinceColors.js'

const props = defineProps({
  scenic: { type: Object, required: true },
  adcode: { type: String, required: true },
})

/** 第一张可用做封面的图：条目在但文件名没落盘时也不出破图 */
const cover = computed(() => props.scenic.images?.find((img) => img.file) ?? null)

/** 一句话取正文的第一句 */
const oneLine = computed(() => {
  const summary = String(props.scenic.summary ?? '')
  const first = summary.split(/[。！？]/)[0]
  return first || summary
})

/** 占位的省色渐变：颜色来自省份的稳定色表，不是写死的色值 */
const placeholderStyle = computed(() => {
  const hex = toHexString(getProvinceColor(props.adcode))
  return { background: `linear-gradient(135deg, ${hex}4d 0%, ${hex}b3 100%)` }
})
</script>

<style scoped>
.scenic-card {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  padding: var(--sp-2);
  background: var(--learn-panel);
  border: 1px solid var(--learn-line);
  border-radius: var(--radius);
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.scenic-card:hover,
.scenic-card:focus-visible {
  border-color: var(--learn-accent);
  transform: translateY(-2px);
}

.scenic-card__thumb {
  display: block;
  aspect-ratio: 8 / 5;
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.scenic-card__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scenic-card__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 28px;
  font-weight: 600;
  /* 省色是中亮度色，首字一律用浅色压在上面对比才够 */
  color: var(--learn-on-tint);
}

.scenic-card__body {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
  padding: 0 var(--sp-1) var(--sp-1);
}

.scenic-card__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-2);
}

.scenic-card__name {
  font-weight: 600;
  color: var(--learn-ink);
}

.scenic-card__level {
  flex: none;
  font-size: 12px;
  color: var(--learn-accent);
  border: 1px solid var(--learn-line);
  border-radius: var(--radius-sm);
  padding: 0 var(--sp-1);
}

.scenic-card__summary {
  font-size: 13px;
  line-height: 1.6;
  color: var(--learn-ink-soft);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
</style>
