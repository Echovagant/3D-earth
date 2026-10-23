<template>
  <div class="learn-page">
    <header class="learn-top">
      <button type="button" class="learn-top__back" @click="goBack">
        <span>‹</span><span>返回地球</span>
      </button>
      <span class="learn-top__title">省会简称全表</span>
      <span class="learn-top__spacer"></span>
      <router-link class="learn-top__back" to="/tools">互动工具</router-link>
    </header>

    <main class="learn-main">
      <h1 class="learn-h1">省会简称全表</h1>
      <p class="learn-lead">
        34 个省级行政区的简称与省会。简称是填图题和选择题里最常考的一层记忆。
      </p>

      <ProvinceAbbrevTable />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import ProvinceAbbrevTable from './ProvinceAbbrevTable.vue'

const router = useRouter()

const goBack = () => {
  if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>
