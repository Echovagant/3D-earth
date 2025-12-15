<template>
  <div class="province-page">
    <h1>{{ provinceName }}欢迎你！</h1>
    <p>欢迎来到美丽的{{ provinceName }}</p>
    <button @click="goBack">返回地球</button>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// 从路由参数获取省份名称[citation:7]
const provinceName = computed(() => route.params.name)

const goBack = () => {
  // 返回地球页面[citation:10]
  router.push('/')
}

onMounted(() => {
  // 可以在这里根据省份名称加载特定数据
  console.log(`加载 ${provinceName.value} 的相关数据`)
})
</script>

<style scoped>
.province-page {
  padding: 2rem;
  text-align: center;
}
</style>


