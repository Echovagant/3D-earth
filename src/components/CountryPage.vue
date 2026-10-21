<template>
  <div class="detail-page">
    <header class="detail-page__bar">
      <button type="button" class="detail-page__back" @click="goBack">
        <span class="detail-page__back-arrow">‹</span>
        <span>返回全球</span>
      </button>
      <span class="detail-page__brand">3D-EARTH <i>/</i> COUNTRY</span>
      <router-link class="detail-page__licenses" to="/licenses">许可</router-link>
      <span class="detail-page__code mono">{{ iso3 }}</span>
    </header>

    <div v-if="loading" class="detail-page__state">读取国家数据…</div>

    <div v-else-if="error" class="detail-page__state detail-page__state--error">
      <p>{{ error }}</p>
      <button type="button" class="detail-page__retry" @click="load">重试</button>
    </div>

    <main v-else-if="country" class="detail-page__main">
      <section class="detail-page__hero">
        <span class="detail-page__abbr">{{ country.name.slice(0, 1) }}</span>
        <div class="detail-page__heading">
          <h1>{{ country.name }}</h1>
          <span class="detail-page__sub mono">
            {{ country.nameEn }} · ISO {{ country.iso3 }}
            <template v-if="country.iso2"> / {{ country.iso2 }}</template>
          </span>
        </div>
      </section>

      <HudPanel class="detail-page__facts" title="基础数据" meta="FACTS">
        <dl class="facts">
          <div v-if="country.fullName !== country.name" class="facts__cell">
            <dt>官方名称</dt>
            <dd>{{ country.fullName }}</dd>
          </div>
          <div class="facts__cell">
            <dt>边界围合面积</dt>
            <dd class="mono">{{ formatArea(country.areaKm2) }}</dd>
          </div>
          <div class="facts__cell">
            <dt>所属大洲</dt>
            <dd>{{ country.continent || '—' }}</dd>
          </div>
          <div class="facts__cell">
            <dt>所属地区</dt>
            <dd>{{ country.region || '—' }}</dd>
          </div>
          <div class="facts__cell">
            <dt>几何中心</dt>
            <dd class="mono">
              {{ country.center ? country.center[0].toFixed(2) : '—' }},
              {{ country.center ? country.center[1].toFixed(2) : '—' }}
            </dd>
          </div>
        </dl>
      </HudPanel>

      <section class="detail-page__intro">
        <span class="detail-page__intro-label">数据说明 / NOTES</span>
        <p>
          边界围合面积由该国的行政区划边界在球面上直接计算得到（球面鞋带公式，地球平均半径
          6371.0088 km），与省级、地级市详情页用的是同一个公式。国名与 ISO 代码取自
          ISO 3166-1 地区划分；这套数据不含人口统计。
        </p>
      </section>

      <div class="detail-page__actions">
        <button type="button" class="detail-page__cta" @click="goBack">返回全球</button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HudPanel from './HudPanel.vue'
import { featureAreaKm2, formatArea } from '../utils/areaData'
import {
  loadWorldCountries,
  countryId,
  countryName,
  countryFullName,
  countryNameEn,
  countryIso2,
  countryContinent,
  countryRegion,
  featureCenter,
} from '../utils/worldData'

const route = useRoute()
const router = useRouter()

const iso3 = computed(() => String(route.params.iso3 ?? ''))
const country = ref(null)
const loading = ref(true)
const error = ref('')

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const geoJson = await loadWorldCountries()
    const feature = geoJson.features.find((item) => countryId(item) === iso3.value)
    if (!feature) throw new Error('未找到该国家')
    country.value = {
      id: countryId(feature),
      name: countryName(feature),
      nameEn: countryNameEn(feature) || '—',
      fullName: countryFullName(feature),
      iso3: countryId(feature),
      iso2: countryIso2(feature),
      continent: countryContinent(feature),
      region: countryRegion(feature),
      center: featureCenter(feature),
      areaKm2: featureAreaKm2(feature),
    }
  } catch (e) {
    error.value = `无法加载国家数据（${e.message}）`
  } finally {
    loading.value = false
  }
}

const goBack = () => router.push('/world')

onMounted(load)
</script>

