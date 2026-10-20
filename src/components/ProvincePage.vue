<template>
  <div class="province-page">
    <div v-if="loading" class="province-page__state">加载中…</div>

    <div v-else-if="error" class="province-page__state province-page__state--error">
      <p>{{ error }}</p>
      <button type="button" @click="load">重试</button>
    </div>

    <template v-else-if="data">
      <header class="province-page__header">
        <span class="province-page__abbr">{{ data.abbreviation }}</span>
        <h1>{{ data.name }}</h1>
        <span class="province-page__code">行政区划代码 {{ data.adcode }}</span>
      </header>

      <dl class="province-page__facts">
        <div>
          <dt>行政中心</dt>
          <dd>{{ data.capital }}</dd>
        </div>
        <div>
          <dt>面积</dt>
          <dd>{{ data.area }}</dd>
        </div>
        <div>
          <dt>人口</dt>
          <dd>{{ data.population }}</dd>
        </div>
        <div>
          <dt>中心坐标</dt>
          <dd>{{ data.center.join(', ') }}</dd>
        </div>
      </dl>

      <p class="province-page__intro">{{ data.intro }}</p>

      <ul class="province-page__tags">
        <li v-for="tag in data.highlights" :key="tag">{{ tag }}</li>
      </ul>

      <button type="button" class="province-page__back" @click="goBack">返回地球</button>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const data = ref(null)
const loading = ref(true)
const error = ref('')

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(`/data/provinces/${route.params.adcode}.json`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    data.value = await res.json()
  } catch (e) {
    error.value = `无法加载该省份的数据（${e.message}）`
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  // 返回地球页面
  router.push('/')
}

onMounted(load)
</script>

<style scoped>
.province-page {
  box-sizing: border-box;
  min-height: 100%;
  padding: 40px 24px;
  overflow-y: auto;
  color: #e8eefc;
  background: radial-gradient(circle at 30% 20%, #16263f 0%, #070d18 70%);
  text-align: center;
}
.province-page__state {
  padding: 60px 0;
  opacity: 0.7;
}
.province-page__state--error {
  color: #ff9a9a;
}
.province-page__state button {
  margin-top: 12px;
  padding: 6px 18px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.province-page__header {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}
.province-page__abbr {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: rgba(120, 170, 255, 0.16);
  border: 1px solid rgba(140, 190, 255, 0.35);
  font-size: 22px;
}
.province-page__header h1 {
  margin: 0;
  font-size: 30px;
  font-weight: 600;
}
.province-page__code {
  font-size: 12px;
  opacity: 0.6;
}
.province-page__facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  max-width: 760px;
  margin: 28px auto 0;
}
.province-page__facts > div {
  padding: 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.province-page__facts dt {
  font-size: 12px;
  opacity: 0.6;
}
.province-page__facts dd {
  margin: 6px 0 0;
  font-size: 16px;
}
.province-page__intro {
  max-width: 680px;
  margin: 28px auto 0;
  line-height: 1.9;
  opacity: 0.85;
}
.province-page__tags {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  margin: 20px 0 0;
  padding: 0;
  list-style: none;
}
.province-page__tags li {
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 13px;
  background: rgba(120, 170, 255, 0.14);
  border: 1px solid rgba(140, 190, 255, 0.28);
}
.province-page__back {
  margin-top: 32px;
  padding: 10px 26px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: transparent;
  color: inherit;
  font-size: 14px;
  cursor: pointer;
}
</style>
