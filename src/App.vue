<template>
  <div id="app" :class="{ 'app--learn': showFoot }">
    <router-view />
    <footer v-if="showFoot" class="site-foot">
      个人学习用途的学习辅助工具 · 知识点索引自 B 站课程视频字幕整理，版权归原作者所有 ·
      视频链接回原平台
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

// 教学层页面（课程地图、章节、知识点、搜索）要挂全局合规声明；
// 地球页与省份页是全屏布局，页脚会挤压它们，所以只在这四类路由上出现。
const route = useRoute()
const showFoot = computed(() => route.meta.learnPage === true)
</script>

<style>
#app {
  width: 100%;
  height: 100%;
}
</style>
