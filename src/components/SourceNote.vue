<template>
  <p class="source-note">
    <span class="source-note__tag">内容来源</span>
    <span class="source-note__body">
      {{ source.sections }}
      <template v-if="source.textbook"> · 教材：{{ source.textbook }}</template>
      <template v-if="source.topics"> —— {{ source.topics }}</template>
    </span>
    <span v-if="source.parts?.length" class="source-note__parts">
      讲解视频：
      <a
        v-for="p in source.parts"
        :key="p"
        :href="partUrl(p)"
        target="_blank"
        rel="noreferrer noopener"
        >{{ partLabel(p) }} →</a
      >
    </span>
  </p>
</template>

<script setup>
import { partLabel, partUrl } from '../data/toolSources'

defineProps({
  /** TOOL_SOURCES 里的一项 */
  source: { type: Object, required: true },
})
</script>

<style scoped>
.source-note {
  margin: var(--sp-1) 0 var(--sp-4);
  font-size: var(--fs-label);
  line-height: 1.9;
  color: var(--learn-ink-faint);
}

.source-note__tag {
  display: inline-block;
  margin-right: var(--sp-2);
  padding: 0 var(--sp-1);
  border: 1px solid var(--learn-line);
  border-radius: var(--radius-sm);
  color: var(--learn-ink-soft);
}

.source-note__body {
  color: var(--learn-ink-soft);
}

.source-note__parts {
  display: inline;
  margin-left: var(--sp-2);
}

.source-note__parts a {
  margin-right: var(--sp-2);
  color: var(--learn-accent);
}
</style>
