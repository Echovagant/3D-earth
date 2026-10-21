<template>
  <div class="country">
    <header class="country__bar">
      <button type="button" class="country__back" @click="goBack">
        <span class="country__back-arrow">‹</span>
        <span>返回全球</span>
      </button>
      <span class="country__brand">3D-EARTH <i>/</i> COUNTRY</span>
      <span class="country__code mono">{{ iso3 }}</span>
    </header>

    <div v-if="loading" class="country__state">读取国家数据…</div>

    <div v-else-if="error" class="country__state country__state--error">
      <p>{{ error }}</p>
      <button type="button" class="country__retry" @click="load">重试</button>
    </div>

    <main v-else-if="country" class="country__main">
      <section class="country__hero">
        <span class="country__abbr">{{ country.name.slice(0, 1) }}</span>
        <div class="country__heading">
          <h1>{{ country.name }}</h1>
          <span class="country__sub mono">
            {{ country.nameEn }} · ISO {{ country.iso3 }}
            <template v-if="country.iso2 && country.iso2 !== '-99'"> / {{ country.iso2 }}</template>
          </span>
        </div>
      </section>

      <HudPanel class="country__facts" title="基础数据" meta="FACTS">
        <dl class="facts">
          <div class="facts__cell">
            <dt>边界围合面积</dt>
            <dd class="mono">{{ formatArea(country.areaKm2) }}</dd>
          </div>
          <div class="facts__cell">
            <dt>人口估计</dt>
            <dd class="mono">
              {{ formatPopulation(country.population) }}
              <small v-if="country.populationYear" class="facts__year">{{ country.populationYear }} 年</small>
            </dd>
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

      <section class="country__intro">
        <span class="country__intro-label">数据说明 / NOTES</span>
        <p>
          边界围合面积由该国的行政区划边界在球面上直接计算得到（球面鞋带公式，地球平均半径
          6371.0088 km），与省级、地级市详情页用的是同一个公式。人口为 Natural Earth
          的估计值，不同国家的数据年份不完全一致，仅供参考。
        </p>
      </section>

      <div class="country__actions">
        <button type="button" class="country__cta" @click="goBack">返回全球</button>
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
  countryPopulation,
  populationYear,
  countryContinent,
  countryRegion,
  featureCenter,
  formatPopulation,
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
      nameEn: feature.properties.NAME || '—',
      iso3: countryId(feature),
      iso2: feature.properties.POSTAL || '',
      population: countryPopulation(feature),
      populationYear: populationYear(feature),
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

<style scoped>
.country {
  position: relative;
  min-height: 100%;
  overflow-y: auto;
  color: var(--text-hi);
  background:
    radial-gradient(circle at 22% 12%, rgba(91, 140, 255, 0.16) 0%, transparent 46%),
    radial-gradient(circle at 80% 80%, rgba(79, 216, 255, 0.1) 0%, transparent 52%),
    var(--bg-void);
}

.country::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(120, 190, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(120, 190, 255, 0.05) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: radial-gradient(circle at 50% 40%, #000 0%, transparent 78%);
}

.country__bar {
  position: sticky;
  top: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: var(--sp-4);
  padding: var(--sp-3) var(--sp-5);
  background: rgba(4, 7, 15, 0.78);
  border-bottom: 1px solid var(--line-faint);
  backdrop-filter: blur(10px);
}

.country__back {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
  padding: 4px 12px 4px 8px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-mid);
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.12em;
  cursor: pointer;
  transition: color var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease);
}

.country__back:hover {
  color: var(--accent);
  border-color: var(--line-strong);
}

.country__back-arrow {
  font-size: 16px;
  line-height: 1;
}

.country__brand {
  flex: 1;
  text-align: center;
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.24em;
  color: var(--text-lo);
}

.country__brand i {
  color: var(--accent);
  opacity: 0.7;
}

.country__code {
  font-size: var(--fs-label);
  letter-spacing: 0.14em;
  color: var(--accent);
  opacity: 0.85;
}

.country__state {
  padding: 80px var(--sp-5);
  text-align: center;
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.16em;
  color: var(--text-lo);
}

.country__state--error {
  color: #ff9a9a;
}

.country__retry {
  margin-top: var(--sp-3);
  padding: 6px 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-mid);
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.12em;
  cursor: pointer;
}

.country__main {
  position: relative;
  z-index: 1;
  max-width: 860px;
  margin: 0 auto;
  padding: var(--sp-6) var(--sp-5);
  animation: rise var(--dur-slow) var(--ease) both;
}

.country__hero {
  display: flex;
  align-items: center;
  gap: var(--sp-4);
  margin-bottom: var(--sp-5);
}

.country__abbr {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  flex: none;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  background: var(--accent-dim);
  color: var(--accent);
  font-size: 28px;
  font-weight: 600;
  box-shadow: var(--glow-soft);
}

.country__heading h1 {
  margin: 0 0 2px;
  font-size: var(--fs-title);
  font-weight: 600;
  letter-spacing: 0.04em;
}

.country__sub {
  font-size: var(--fs-label);
  letter-spacing: 0.1em;
  color: var(--text-lo);
}

.country__facts {
  margin-bottom: var(--sp-5);
}

.facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--sp-3);
  margin: 0;
}

.facts__cell {
  padding: var(--sp-3);
  border: 1px solid var(--line-faint);
  border-radius: var(--radius-sm);
  background: rgba(0, 0, 0, 0.22);
}

.facts__cell dt {
  font-size: var(--fs-label);
  letter-spacing: 0.14em;
  color: var(--text-lo);
}

.facts__cell dd {
  margin: var(--sp-1) 0 0;
  font-size: var(--fs-value);
  color: var(--text-hi);
}

.facts__year {
  margin-left: 4px;
  font-size: var(--fs-label);
  color: var(--text-lo);
}

.country__intro {
  position: relative;
  margin-bottom: var(--sp-5);
  padding-left: var(--sp-4);
  border-left: 2px solid var(--accent-soft);
}

.country__intro-label {
  display: block;
  margin-bottom: var(--sp-2);
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.2em;
  color: var(--accent);
  opacity: 0.8;
}

.country__intro p {
  margin: 0;
  line-height: 1.95;
  color: var(--text-mid);
}

.country__actions {
  display: flex;
  justify-content: center;
}

.country__cta {
  padding: 9px 28px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  background: var(--accent-dim);
  color: var(--text-hi);
  font-family: var(--font-mono);
  font-size: var(--fs-body);
  letter-spacing: 0.14em;
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease), box-shadow var(--dur-fast) var(--ease);
}

.country__cta:hover {
  background: rgba(79, 216, 255, 0.18);
  box-shadow: var(--glow-soft);
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>
