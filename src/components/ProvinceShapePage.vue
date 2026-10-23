<template>
  <div class="learn-page">
    <header class="learn-top">
      <button type="button" class="learn-top__back" @click="goBack">
        <span>‹</span><span>返回地球</span>
      </button>
      <span class="learn-top__title">轮廓形象记忆</span>
      <span class="learn-top__spacer"></span>
      <router-link class="learn-top__back" to="/tools">互动工具</router-link>
    </header>

    <main class="learn-main">
      <h1 class="learn-h1">轮廓形象记忆</h1>
      <p class="learn-lead">
        左边选省，右边是这一省的真实轮廓。轮廓是硬的，比"想象一下"好记。
      </p>
      <SourceNote :source="TOOL_SOURCES['province-shape']" />

      <ProvinceShapeMemory />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import SourceNote from './SourceNote.vue'
import { TOOL_SOURCES } from '../data/toolSources'
import ProvinceShapeMemory from './ProvinceShapeMemory.vue'

const router = useRouter()

const goBack = () => {
  if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>
