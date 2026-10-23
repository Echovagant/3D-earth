<template>
  <section class="learn-page prov-abbrev">
    <div class="learn-panel">
      <h2 class="learn-panel__title">省级行政区简称</h2>
      <p class="learn-lead">{{ source.length }} 个省级行政区的常用简称与首府，按地理分区排列。</p>

      <input
        v-model="keyword"
        class="learn-input"
        type="search"
        placeholder="按省份名称或简称筛选，例如：四川、川、粤"
        aria-label="按省份名称或简称筛选"
      />

      <div v-if="loading" class="learn-empty">读取省份索引…</div>
      <div v-else-if="error" class="learn-error">
        <p>{{ error }}</p>
        <button type="button" class="learn-top__back" @click="load">重试</button>
      </div>
      <template v-else>
        <div class="prov-abbrev__table-wrap">
          <table class="learn-table prov-abbrev__table">
            <thead>
              <tr>
                <th scope="col">省份</th>
                <th scope="col">简称</th>
                <th scope="col">省会</th>
              </tr>
            </thead>
            <tbody v-if="filtered.length === 0">
              <tr>
                <td colspan="3" class="prov-abbrev__empty">没有匹配的省份，换个关键词再试。</td>
              </tr>
            </tbody>
            <tbody v-for="group in groups" :key="group.key">
              <tr v-if="group.label" class="prov-abbrev__group">
                <th colspan="3">
                  <span class="prov-abbrev__group-label">{{ group.label }}</span>
                  <span class="prov-abbrev__group-count">{{ group.items.length }}</span>
                </th>
              </tr>
              <tr v-for="item in group.items" :key="item.adcode" class="prov-abbrev__row">
                <td>{{ item.name }}</td>
                <td class="prov-abbrev__abbr">{{ item.abbreviation }}</td>
                <td>{{ item.capital }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="learn-panel__meta learn-panel__meta--spaced">
          共 {{ source.length }} 个省级行政区，当前筛选出 {{ filtered.length }} 个。
        </p>
        <p class="learn-panel__meta">
          简称与首府取自 <code>public/data/provinces/index.json</code>，由
          <code>scripts/build-province-index.mjs</code> 从各省详情数据汇总生成。
        </p>
      </template>
    </div>
  </section>
</template>

<script setup>
/**
 * 省级行政区简称表。
 *
 * 省份名单不自维护：数据来自 public/data/provinces/index.json
 * （由 scripts/build-province-index.mjs 从各省详情数据汇总生成）。
 * 本组件在没人喂数据时自己去取这份索引，也允许外部传 provinces 覆盖，
 * 便于测试与将来复用。
 */
import { computed, onMounted, ref, watch } from 'vue'
import { assetUrl } from '../utils/base'
import { groupByRegion, REGION_GROUPS } from '../utils/provinceColors'

const props = defineProps({
  /**
   * 可选的省份数据。传了就用这份，不再请求索引：
   *   对象：{ adcode: { name, abbreviation, capital } }
   *   数组：[{ adcode, name, abbreviation, capital }]
   */
  provinces: { type: [Object, Array], default: null },
  /** 是否按地理分区（华北 / 东北 / 华东 …）分组展示 */
  grouped: { type: Boolean, default: true },
})

const INDEX_URL = assetUrl('/data/provinces/index.json')

const keyword = ref('')
/** 自己请求到的省份数据 */
const fetched = ref([])
const status = ref('idle')
const error = ref('')

/** 把两种入参形态统一成一条条记录 */
const normalize = (raw) => {
  const entries = Array.isArray(raw)
    ? raw.map((item, index) => [String(item?.adcode ?? index), item])
    : Object.entries(raw ?? {})
  return entries.map(([adcode, item]) => ({
    adcode: String(adcode),
    name: String(item?.name ?? ''),
    abbreviation: String(item?.abbreviation ?? ''),
    capital: String(item?.capital ?? ''),
  }))
}

/** 外部喂进来的数据优先，没喂才用自己请求的 */
const source = computed(() => (props.provinces ? normalize(props.provinces) : fetched.value))

const loading = computed(() => status.value === 'loading')

const load = async () => {
  if (props.provinces) return
  status.value = 'loading'
  error.value = ''
  try {
    const response = await fetch(INDEX_URL)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const payload = await response.json()
    const list = normalize(payload?.provinces ?? {})
    if (!list.length) throw new Error('索引为空')
    fetched.value = list
    status.value = 'ready'
  } catch (e) {
    error.value = `无法加载省份索引（${e.message}）`
    status.value = 'error'
  }
}

onMounted(load)

// 外部数据被撤掉时（改回不传 provinces），要重新自己拉
watch(
  () => props.provinces,
  (value) => {
    if (value) {
      error.value = ''
      status.value = 'ready'
    } else {
      load()
    }
  },
)

/** 按省名或简称过滤 */
const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return source.value
  return source.value.filter(
    (item) => item.name.toLowerCase().includes(kw) || item.abbreviation.toLowerCase().includes(kw),
  )
})

const groups = computed(() => {
  if (!props.grouped) {
    return [
      {
        key: 'all',
        label: '',
        items: [...filtered.value].sort((a, b) => a.name.localeCompare(b.name, 'zh')),
      },
    ]
  }
  // groupByRegion 只认分区表里登记过的 adcode：索引若新增了未登记的省，
  // 这里会把它漏掉，所以没被任何分区收下的条目单独兜一个分组
  const known = new Set(REGION_GROUPS.flatMap((group) => group.adcodes))
  const grouped = groupByRegion(filtered.value)
  const rest = filtered.value.filter((item) => !known.has(item.adcode))
  return rest.length ? [...grouped, { key: 'other', label: '其他', items: rest }] : grouped
})
</script>

<style scoped>
.prov-abbrev__table-wrap {
  margin-top: var(--sp-3);
  overflow-x: auto;
}

.prov-abbrev__table {
  width: 100%;
}

/* 分区标题行：跟表头区分开，别抢列名的位置 */
.prov-abbrev__group th {
  background: transparent;
  color: var(--learn-ink-soft);
  font-weight: 600;
  text-align: left;
}

.prov-abbrev__group-count {
  margin-left: var(--sp-2);
  color: var(--learn-ink-faint);
  font-size: var(--fs-label);
  font-weight: 400;
}

/* 简称是这张表的主角，比省名更显眼一点 */
.prov-abbrev__abbr {
  color: var(--learn-accent);
  font-weight: 600;
}

.prov-abbrev__empty {
  padding: var(--sp-4);
  color: var(--learn-ink-faint);
  text-align: center;
}
</style>
