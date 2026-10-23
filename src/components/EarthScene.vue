<template>
  <div ref="container" class="earth-container">
    <div class="hud">
      <HudPanel class="hud__telemetry" title="遥测" meta="TELEMETRY">
        <dl class="telemetry">
          <div class="telemetry__row">
            <dt>中心</dt>
            <dd class="mono">{{ telemetry.center }}</dd>
          </div>
          <div class="telemetry__row">
            <dt>视距</dt>
            <dd class="mono">{{ telemetry.distance }}</dd>
          </div>
          <div class="telemetry__row">
            <dt>自转</dt>
            <dd class="mono" :class="{ 'is-on': autoRotate }">{{ telemetry.rotating }}</dd>
          </div>
        </dl>
      </HudPanel>

      <ProvinceLegend
        v-if="legendItems.length"
        class="hud__legend"
        :items="legendItems"
        :active="hoveredAdcode"
        grouped
        title="省级行政区"
        @hover="onLegendHover"
      />

      <p class="hud__hint">
        <span>拖拽</span> 旋转
        <span>滚轮</span> 缩放
        <span>点击</span> 进入省份
      </p>

      <div class="hud__corner">
        <button type="button" class="hud__world-link" @click="goWorld">
          全球视角
        </button>

        <button class="hud__labels-toggle" type="button" @click="labelsVisible = !labelsVisible">
          省名标注<span class="mono">{{ labelsVisible ? 'ON' : 'OFF' }}</span>
        </button>

        <router-link class="hud__corner-link" to="/course">课程地图</router-link>
        <router-link class="hud__corner-link" to="/licenses">许可</router-link>
      </div>

      <div
        v-if="hoveredName && highlightSource === 'globe'"
        ref="lockEl"
        class="lock"
        :class="{ 'lock--flip': pointerFlip }"
      >
        <span class="lock__reticle"></span>
        <span class="lock__leader"></span>
        <span class="lock__tag">
          <span class="lock__name">{{ hoveredName }}</span>
          <span class="lock__code mono">{{ hoveredAdcode }}</span>
        </span>
      </div>
    </div>

    <!-- 数据加载状态：加载中 / 失败 -->
    <div
      v-if="provinceStatus !== 'ready'"
      class="scene-status"
      :class="`scene-status--${provinceStatus}`"
    >
      <div class="scene-status__box">
        <template v-if="provinceStatus === 'loading'">
          <span class="scene-status__spinner" aria-hidden="true"></span>
          <p class="scene-status__text">正在加载行政区划数据…</p>
        </template>
        <template v-else>
          <p class="scene-status__text scene-status__text--error">{{ provinceError }}</p>
          <button type="button" class="scene-status__retry" @click="initProvinces">重试</button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useRouter } from 'vue-router'
import { createProvinceMeshFromFeature, lonLatToCartesian } from '../utils/geoDataProcessor'
import { easeInOutCubic, pointerToNdc } from '../utils/globeMath'
import { isClickGesture } from '../utils/gesture'
import { getProvinceColor, toHexString } from '../utils/provinceColors'
import { featureAreaKm2 } from '../utils/areaData'
import {
  LABEL_BASE_HEIGHT,
  cameraDirectionInEarthFrame,
  cameraLonLat,
  createLabelTexture,
  earthLocalToWorld,
  featureSizeProxy,
  labelOpacity,
  labelPixelHeight,
  labelPosition,
  placeLabels,
  resolveLabelCenter,
} from '../utils/provinceLabels'
import HudPanel from './HudPanel.vue'
import ProvinceLegend from './ProvinceLegend.vue'

const container = ref(null)
const router = useRouter()

// 悬停中的省份
const hoveredName = ref('')
const hoveredAdcode = ref('')
// 高亮来源：'globe' 来自球面拾取，'legend' 来自图例悬停。
// 准星标注跟着球面指针走，图例悬停时指针并不在球面上，画出来会指向错误的省份。
const highlightSource = ref('globe')
// 指针位置不走响应式：mousemove 每秒可达上百次，
// 每次改动都会触发组件重渲染，实测比 raycast 本身贵两个数量级。
const pointer = { x: 0, y: 0 }
// 只有贴近右缘时才需要翻转标签，变化极少，保留响应式
const pointerFlip = ref(false)
// 锁定标注的 DOM 节点，位置由命令式写入
const lockEl = ref(null)
// 遥测读数
const telemetry = ref({ center: '—', distance: '—', rotating: 'OFF' })
// 图例数据
const legendItems = ref([])
// 省份数据加载状态：loading / ready / error
const provinceStatus = ref('loading')
const provinceError = ref('')
// 球面省名标注是否显示
const labelsVisible = ref(true)

// 组件级状态。不要挂到 window 上：组件卸载时无法回收。
let scene, camera, renderer, earth, controls, animationId
let provinceGroup = null
let labelGroup = null
// 组件是否已卸载。异步加载完成后要检查，否则会往已销毁的场景里加对象。
let disposed = false
let stars = null
let starGeometry = null
let starSizes = null
let twinkleStars = null
let removePointerListeners = null
// 地球是否自动自转。点击省份聚焦时暂停，避免目标在飞行途中飘走
const autoRotate = ref(true)
// 相机飞行插值状态
let flight = null
// adcode → GeoJSON feature，用于取中心点
const provinceFeatures = new Map()
// 悬停高亮状态
let hoveredProvince = null
let highlightMaterial = null
const originalMaterials = new Map()
// 遥测读数的节流时间戳
let lastTelemetryAt = 0

/** 地球自转：每秒的弧度（约 0.68°/s） */
const SPIN_RATE = 0.012
/** 相机飞行的时长（毫秒）。点击后要等它跑完再跳详情页，镜头移动才看得见。 */
const FLY_DURATION = 520
/** 自转轴：Y 轴 */
const SPIN_AXIS = new THREE.Vector3(0, 1, 0)
/** 上一次推进自转的时间戳 */
let lastSpinAt = 0

// 拾取用的射线与归一化坐标
const pickRaycaster = new THREE.Raycaster()
const pickNdc = new THREE.Vector2()
// 待拾取请求。指针事件频率可能远高于帧率（高刷鼠标可达 1000Hz），
// 而一次全量射线求交要测 23k 个三角形（约 0.6ms）。
// 事件只登记请求，实际求交合并到渲染循环里，每帧至多一次。
let pendingPick = null
// 画布位置缓存。mousemove 里读 getBoundingClientRect 会在上一帧刚写过
// 标注样式后触发强制重排（实测 2.26ms），而画布只在 resize 时会移动。
let canvasRect = { left: 0, top: 0, width: 0, height: 0 }

// 系统开启「减少动态效果」时停掉星空闪烁（纯装饰；地球自转属于内容本身，不停）
const reducedMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)')
let prefersReducedMotion = reducedMotionQuery?.matches ?? false

// 刷新左上角遥测面板
const updateTelemetry = () => {
  if (!camera) return
  const distance = camera.position.length()
  const [lon, lat] = cameraLonLat(camera.position, earth.rotation.y)
  telemetry.value = {
    center: formatLonLat(lon, lat),
    distance: `${distance.toFixed(2)} R`,
    rotating: autoRotate.value ? 'ON 0.68°/s' : 'HOLD',
  }
}

// 标注位置直接写 DOM，绕开 Vue 的渲染流程
const applyLockPosition = () => {
  const el = lockEl.value
  if (!el) return
  el.style.left = `${pointer.x}px`
  el.style.top = `${pointer.y}px`
}

// 刷新画布位置缓存
const refreshCanvasRect = () => {
  if (!renderer) return
  const r = renderer.domElement.getBoundingClientRect()
  canvasRect = { left: r.left, top: r.top, width: r.width, height: r.height }
}

// 执行一次拾取。由渲染循环调用，每帧至多一次。
const doPick = () => {
  if (!pendingPick || !camera || !provinceGroup) return
  const { x, y } = pendingPick
  pendingPick = null

  // 只对省份组求交，避免遍历整个场景（含 5000 个点的星空）
  pickRaycaster.setFromCamera(pickNdc.set(x, y), camera)
  const intersects = pickRaycaster.intersectObjects(provinceGroup.children, false)

  let picked = null
  for (const intersect of intersects) {
    if (intersect.object.userData.isProvince) {
      picked = intersect.object
      break
    }
  }
  setHovered(picked, 'globe')
}

// 标注元素是 v-if 渲染的，出现后要把当前指针位置补上
watch(
  () => hoveredName.value && highlightSource.value === 'globe',
  async (visible) => {
    if (!visible) return
    await nextTick()
    applyLockPosition()
  },
)

const formatLonLat = (lon, lat) => {
  const ew = lon >= 0 ? 'E' : 'W'
  const ns = lat >= 0 ? 'N' : 'S'
  return `${Math.abs(lon).toFixed(2)}°${ew} ${Math.abs(lat).toFixed(2)}°${ns}`
}

// 统一的悬停切换：还原旧材质、释放旧高亮材质、设置新高亮材质
// source 标明这次高亮来自哪里，决定是否画准星标注
const setHovered = (next, source = 'globe') => {
  // 来源必须在早退之前更新：同一个省份可能先从图例悬停、再从球面悬停命中，
  // 目标没变会走早退，但准星该重新出现。
  highlightSource.value = source
  if (next === hoveredProvince) return

  // 恢复之前悬停的省份
  if (hoveredProvince && originalMaterials.has(hoveredProvince)) {
    hoveredProvince.material = originalMaterials.get(hoveredProvince)
    originalMaterials.delete(hoveredProvince)
  }

  // 释放上一轮克隆出来的高亮材质，否则每次切换悬停都会漏一个材质
  if (highlightMaterial) {
    highlightMaterial.dispose()
    highlightMaterial = null
  }

  // 高亮当前悬停的省份
  if (next) {
    originalMaterials.set(next, next.material)

    highlightMaterial = next.material.clone()
    highlightMaterial.emissive = new THREE.Color(0x444444) // 添加自发光效果
    highlightMaterial.opacity = 0.9

    next.material = highlightMaterial
  }

  hoveredProvince = next
  hoveredName.value = next?.userData.provinceName ?? ''
  hoveredAdcode.value = next?.userData.adcode ?? ''
}

// 图例项悬停 → 在球面上高亮对应省份。
// 此时指针在图例面板上而不在球面上，准星标注没有正确的落点，不画。
const onLegendHover = (adcode) => {
  if (!adcode) {
    setHovered(null)
    return
  }
  const mesh = provinceGroup?.children.find((m) => m.userData.adcode === adcode)
  setHovered(mesh ?? null, 'legend')
}

onMounted(() => {
  initThree()
  initEarth()
  initControls()
  initProvinces() // 初始化中国省份地图
  initCountryBorder() // 中国整体边界与国界
  initRaycaster()
  window.addEventListener('resize', onResize)
  window.addEventListener('scroll', refreshCanvasRect, { passive: true, capture: true })
  reducedMotionQuery?.addEventListener?.('change', onReducedMotionChange)
  animate()
  focusOnChina() // 初始视角聚焦中国
})

onUnmounted(() => {
  disposed = true
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  window.removeEventListener('scroll', refreshCanvasRect, { capture: true })
  reducedMotionQuery?.removeEventListener?.('change', onReducedMotionChange)
  removePointerListeners?.()
  controls?.dispose()
  disposeScene()
  renderer?.dispose()
})

// 系统的「减少动态效果」开关可以在运行中改变
const onReducedMotionChange = (event) => {
  prefersReducedMotion = event.matches
}

// 释放场景里的几何体、材质与贴图。只调用 renderer.dispose() 只能回收 WebGL 上下文，
// 几何体/材质/贴图仍会留在 GPU 上；每次进出省份页都会累积一份。
const disposeScene = () => {
  if (!scene) return
  const disposedTextures = new Set()
  scene.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose()
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
    materials.forEach((material) => {
      if (!material) return
      Object.values(material).forEach((value) => {
        if (value && value.isTexture && !disposedTextures.has(value)) {
          disposedTextures.add(value)
          value.dispose()
        }
      })
      material.dispose()
    })
  })
  scene.clear()
  scene = null
}

const initThree = () => {
  // 初始化场景
  const { clientWidth, clientHeight } = container.value
  scene = new THREE.Scene()

  // 初始化相机
  camera = new THREE.PerspectiveCamera(75, clientWidth / clientHeight, 0.1, 1000)
  camera.position.z = 5

  // 初始化渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true })
  // 高分屏下按设备像素比渲染，否则画面会发糊
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(clientWidth, clientHeight)
  container.value.appendChild(renderer.domElement)
  refreshCanvasRect()

  // 创建星空背景
  createStarfield()
}

const initEarth = () => {
  // 创建地球材质和几何体
  const geometry = new THREE.SphereGeometry(2, 64, 64)
  const textureLoader = new THREE.TextureLoader()
  // 地球贴图：NASA BMNG「地形与水深」，来源见 LICENSES.md
  const earthTexture = textureLoader.load(
    '/textures/earth_atmos_4096.jpg',
    undefined,
    undefined,
    () => {
      console.warn('地球贴图加载失败，使用纯色材质')
    },
  )
  // 贴图存的是 sRGB 编码的 JPEG，**必须**声明成 sRGB 颜色空间。
  // 漏掉这一句，three.js 会把 sRGB 数据当线性数据处理：整体发灰、对比度被压掉，
  // 卫星影像看起来像蒙了一层雾——这是「贴图模糊」的主因，与分辨率无关。
  earthTexture.colorSpace = THREE.SRGBColorSpace
  // 各向异性过滤：画面边缘是掠射角，贴图沿视线方向被压缩，
  // 没有它边缘会糊成一片。
  earthTexture.anisotropy = renderer.capabilities.getMaxAnisotropy()

  const material = new THREE.MeshPhongMaterial({
    map: earthTexture,
    specular: new THREE.Color(0x333333),
    shininess: 5,
  })

  earth = new THREE.Mesh(geometry, material)
  scene.add(earth)

  // 添加光照
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
  directionalLight.position.set(5, 3, 5)
  scene.add(directionalLight)

  // 添加额外的补光
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.3)
  fillLight.position.set(-3, -1, -2)
  scene.add(fillLight)
}

// 添加星空背景创建函数 - 优化版本，减少晕3D问题
const createStarfield = () => {
  // 创建星空几何体
  starGeometry = new THREE.BufferGeometry()
  const starCount = 5000 // 减少星星数量，降低视觉复杂度

  // 创建星星位置数组
  const positions = new Float32Array(starCount * 3)
  const colors = new Float32Array(starCount * 3)
  starSizes = new Float32Array(starCount)

  // 填充星星数据
  for (let i = 0; i < starCount; i++) {
    // 使用更远的距离和更大的半径，让星星移动更缓慢
    const radius = 200 + Math.random() * 800 // 增加星空半径，让星星移动更缓慢
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(Math.random() * 2 - 1)

    const x = radius * Math.sin(phi) * Math.cos(theta)
    const y = radius * Math.sin(phi) * Math.sin(theta)
    const z = radius * Math.cos(phi)

    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z

    // 使用更柔和的颜色
    const colorIntensity = 0.5 + Math.random() * 0.3 // 降低亮度
    const blueTint = Math.random() * 0.2 // 减少蓝色调
    colors[i * 3] = colorIntensity // R
    colors[i * 3 + 1] = colorIntensity - blueTint * 0.1 // G
    colors[i * 3 + 2] = colorIntensity + blueTint // B

    // 每颗星的基准大小（逐顶点属性 aSize）
    starSizes[i] = 0.8 + Math.random() * 1.4
  }

  starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  starGeometry.setAttribute('aSize', new THREE.BufferAttribute(starSizes, 1))

  // 创建星星材质 - 使用更柔和的设置
  const starMaterial = new THREE.PointsMaterial({
    size: 1,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.6, // 降低透明度
    blending: THREE.AdditiveBlending,
  })

  // PointsMaterial 的顶点着色器只读 uniform size（gl_PointSize = size;），
  // 没有逐顶点大小属性。要做逐星闪烁必须注入 aSize 并接管 gl_PointSize 的赋值。
  starMaterial.onBeforeCompile = (shader) => {
    shader.vertexShader = `attribute float aSize;\n${shader.vertexShader.replace(
      'gl_PointSize = size;',
      'gl_PointSize = aSize;',
    )}`
  }

  // 创建星星系统
  stars = new THREE.Points(starGeometry, starMaterial)

  // 将星星添加到场景中，但设置为不随相机旋转
  stars.userData = { isStarfield: true, originalRotation: stars.rotation.clone() }
  scene.add(stars)

  // 添加一些闪烁的星星（使用动画）- 减少闪烁星星数量
  twinkleStars = []
  for (let i = 0; i < 50; i++) {
    // 减少闪烁星星数量
    const starIndex = Math.floor(Math.random() * starCount)
    twinkleStars.push(starIndex)
  }
}

// 容器尺寸跟随窗口变化：同步画布尺寸与相机长宽比
const onResize = () => {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  if (!clientWidth || !clientHeight) return
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
  refreshCanvasRect()
}

const initControls = () => {
  // 初始化轨道控制器
  // 使用从 examples 导入的 OrbitControls
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true // 启用阻尼惯性
  controls.dampingFactor = 0.05
  controls.rotateSpeed = 0.5
  controls.minDistance = 2.3 // 允许贴近球面观察省份
  controls.maxDistance = 12 // 允许拉远看整球
}

// 按当前视角取边界数据。
// 省级边界随仓库分发，运行时不再请求第三方接口。
const loadBoundaryData = async () => {
  const response = await fetch('/geojson/china-provinces.json')
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return { geoJson: await response.json() }
}

/** 释放一个对象树的几何体、材质与贴图 */
const disposeObject = (object) => {
  if (!object) return
  object.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose()
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
    materials.forEach((material) => {
      if (!material) return
      if (material.map) material.map.dispose()
      material.dispose()
    })
  })
}

/**
 * 摘掉并释放当前的省份面与标注。
 *
 * 点击「重试」时也要先清一遍，否则同一区域会叠着两层半透明面，标注也会重复。
 */
const clearProvinceLayers = () => {
  if (!earth) return
  for (const [group, key] of [
    [provinceGroup, 'provinceGroup'],
    [labelGroup, 'labelGroup'],
  ]) {
    if (!group) continue
    earth.remove(group)
    disposeObject(group)
    if (key === 'provinceGroup') provinceGroup = null
    else labelGroup = null
  }
  provinceFeatures.clear()
}

const initProvinces = async () => {
  provinceStatus.value = 'loading'
  provinceError.value = ''
  // 重试时先把上一份面与标注摘掉并释放。
  // 不清的话会叠加第二份：同一区域两层半透明面（z-fighting、颜色变深）且标注重复。
  clearProvinceLayers()
  try {
    const { geoJson } = await loadBoundaryData()
    // 加载期间可能已经离开这个页面：这时不能再往场景里加对象
    if (disposed || !earth) return

    geoJson.features.forEach((feature) => {
      provinceFeatures.set(String(feature.properties.adcode), feature)
    })

    // 将GeoJSON数据转换为3D对象并添加到地球
    provinceGroup = createProvincesFromGeoJson(geoJson)
    earth.add(provinceGroup)

    // 球面省名标注
    labelGroup = createProvinceLabels(geoJson.features)
    earth.add(labelGroup)

    // 图例：九段线不是省级行政区，不进图例
    legendItems.value = geoJson.features
      .filter((feature) => String(feature.properties.adcode) !== '100000_JD')
      .map((feature) => ({
        adcode: String(feature.properties.adcode),
        name: feature.properties.name,
        color: toHexString(getProvinceColor(feature.properties.adcode)),
        area: featureAreaKm2(feature),
      }))

    provinceStatus.value = 'ready'
  } catch (error) {
    // 组件已经卸载时不要再改状态
    if (disposed) return
    provinceError.value = `行政区划数据加载失败：${error.message}`
    provinceStatus.value = 'error'
    console.error('加载行政区划数据失败:', error)
  }
}

// 球面省名标注：每个省一个 Sprite，钉在该省中心点上，永远正对相机。
const createProvinceLabels = (features) => {
  const group = new THREE.Group()
  group.name = 'province-labels'

  for (const feature of features) {
    const name = feature.properties?.name
    if (!name) continue // 九段线要素没有名字
    const center = resolveLabelCenter(feature)
    if (!center) continue

    const { texture, width, height } = createLabelTexture(name)
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      // 标注不被省份面遮挡
      depthTest: false,
      depthWrite: false,
      opacity: 0,
    })
    const sprite = new THREE.Sprite(material)
    const [x, y, z] = labelPosition(center)
    sprite.position.set(x, y, z)
    sprite.renderOrder = 2
    sprite.userData = {
      adcode: String(feature.properties.adcode),
      name,
      aspect: width / height,
      // 去重叠时的优先级：省域越大越优先
      priority: featureSizeProxy(feature),
    }
    group.add(sprite)
  }

  return group
}

// 每帧更新标注：背面不显示、临近边缘淡出、尺寸随距离变化保持屏幕大小恒定，
// 并在屏幕空间做去重叠——按省域大小贪心放置，与已放置标签重叠的隐藏。
// 东海岸省份密集，不去重叠会糊成一团；放大后标签散开，更多省份会自动出现。
const updateProvinceLabels = () => {
  if (!labelGroup || !camera || !earth) return
  const camDir = cameraDirectionInEarthFrame(camera.position, earth.rotation.y)

  const viewportW = canvasRect.width
  const viewportH = canvasRect.height
  const pixelH = labelPixelHeight(LABEL_BASE_HEIGHT, camera.fov, viewportH)
  const world = new THREE.Vector3()
  const ndc = new THREE.Vector3()

  const candidates = []
  for (const sprite of labelGroup.children) {
    // 正在悬停的省份由准星标注报名字，不重复标
    if (!labelsVisible.value || sprite.userData.adcode === hoveredAdcode.value) {
      sprite.visible = false
      continue
    }

    const opacity = labelOpacity(sprite.position.dot(camDir))
    if (opacity <= 0) {
      sprite.visible = false
      continue
    }

    world.copy(earthLocalToWorld(sprite.position, earth.rotation.y))
    ndc.copy(world).project(camera)
    if (ndc.z > 1) {
      sprite.visible = false
      continue
    }

    candidates.push({
      sprite,
      opacity,
      priority: sprite.userData.priority,
      aspect: sprite.userData.aspect,
      distance: world.distanceTo(camera.position),
      x: (ndc.x * 0.5 + 0.5) * viewportW,
      y: (-ndc.y * 0.5 + 0.5) * viewportH,
    })
  }

  // 面积大的省先占位，小省与已放置标签重叠就让位
  placeLabels(candidates, pixelH)
}

// 加载中国整体边界：一份淡色底板 + 白色国界，让国界与省界的层级更清楚。
// china.json 本身是 MultiPolygon，能正确三角化的前提是顶点表按 polygon 重建。
const initCountryBorder = async () => {
  try {
    const response = await fetch('/geojson/china.json')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const geoJson = await response.json()
    // 加载期间组件可能已卸载：这时不能再往场景里加对象
    if (disposed || !earth) return
    const feature = geoJson.features[0]
    if (!feature) return

    const mesh = createProvinceMeshFromFeature(feature, {
      radius: 2,
      elevation: 0.006,
      materialOptions: {
        color: 0x9fb6d9,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
        depthWrite: false,
      },
      lineColor: 0xdce8ff,
    })
    if (mesh) {
      mesh.userData = { ...mesh.userData, isCountry: true }
      earth.add(mesh)
    }
  } catch (error) {
    // 国界是增强层，取不到不影响省份交互，不打断主流程
    console.warn('加载国界数据失败:', error)
  }
}

const createProvincesFromGeoJson = (geoJson) => {
  const group = new THREE.Group()

  geoJson.features.forEach((feature) => {
    const { name, adcode } = feature.properties

    // 使用工具函数将 GeoJSON 转为贴合球面的 BufferGeometry Mesh
    const mesh = createProvinceMeshFromFeature(feature, {
      radius: 2,
      elevation: 0.02,
      materialOptions: {
        color: getProvinceColor(adcode),
        transparent: true,
        opacity: 0.7, // 降低透明度让轮廓更明显
        shininess: 30,
      },
      lineColor: 0xffffff, // 白色省界
    })
    if (mesh) {
      // ensure province metadata is present
      mesh.userData = Object.assign(mesh.userData || {}, {
        provinceName: name,
        adcode: String(adcode),
        isProvince: true,
      })
      group.add(mesh)
    }
  })

  return group
}

const initRaycaster = () => {
  let mouseDownTime = 0
  let mouseDownPosition = { x: 0, y: 0 }

  const onMouseDown = (event) => {
    mouseDownTime = Date.now()
    mouseDownPosition.x = event.clientX
    mouseDownPosition.y = event.clientY
  }

  const onMouseUp = (event) => {
    const clickDuration = Date.now() - mouseDownTime
    const moveDistance = Math.sqrt(
      Math.pow(event.clientX - mouseDownPosition.x, 2) +
        Math.pow(event.clientY - mouseDownPosition.y, 2),
    )

    // 只有当点击时间短且移动距离小才认为是有效点击
    if (isClickGesture(clickDuration, moveDistance)) {
      handleValidClick(event)
    }

    mouseDownTime = 0
  }

  const onMouseMove = (event) => {
    // 用缓存的画布位置，不读布局
    const localX = event.clientX - canvasRect.left
    const localY = event.clientY - canvasRect.top

    // 记录指针在容器内的位置，供 HUD 锁定标注跟随
    pointer.x = localX
    pointer.y = localY
    pointerFlip.value = localX > canvasRect.width * 0.62
    applyLockPosition()

    // 只登记待拾取，实际求交在渲染循环里做（每帧至多一次）
    const ndc = pointerToNdc(event.clientX, event.clientY, canvasRect)
    pendingPick = { x: ndc.x, y: ndc.y }
  }

  const handleValidClick = (event) => {
    // 将鼠标位置归一化为-1到1的范围
    const ndc = pointerToNdc(event.clientX, event.clientY, canvasRect)

    // 通过相机和鼠标位置更新射线
    pickRaycaster.setFromCamera(pickNdc.set(ndc.x, ndc.y), camera)

    // 计算与射线相交的物体
    const intersects = provinceGroup
      ? pickRaycaster.intersectObjects(provinceGroup.children, false)
      : []

    for (const intersect of intersects) {
      if (intersect.object.userData.isProvince) {
        handleProvinceClick(intersect.object.userData.provinceName, intersect.object.userData.adcode)
        break
      }
    }
  }

  // 鼠标移出画布时清掉提示条与高亮
  const onMouseLeave = () => setHovered(null)

  renderer.domElement.addEventListener('mousedown', onMouseDown)
  renderer.domElement.addEventListener('mousemove', onMouseMove)
  renderer.domElement.addEventListener('mouseup', onMouseUp)
  renderer.domElement.addEventListener('mouseleave', onMouseLeave)

  // 卸载时解绑，否则组件反复挂载会叠加监听器
  removePointerListeners = () => {
    renderer.domElement.removeEventListener('mousedown', onMouseDown)
    renderer.domElement.removeEventListener('mousemove', onMouseMove)
    renderer.domElement.removeEventListener('mouseup', onMouseUp)
    renderer.domElement.removeEventListener('mouseleave', onMouseLeave)
  }
}

const handleProvinceClick = (provinceName, adcode) => {
  const feature = provinceFeatures.get(String(adcode))
  const center = feature?.properties?.center
  const canFly = Array.isArray(center) && center.length >= 2

  // 相机飞到该省上空，飞行结束后再进入省份详情
  // 九段线不是省级行政区，没有详情页
  if (!provinceName) return
  const go = () => router.push(`/province/${encodeURIComponent(adcode)}`)
  if (canFly) flyTo(center[0], center[1], 3.2, FLY_DURATION, go)
  else go()
}

// 切到全球视角
const goWorld = () => router.push('/world')

// 相机飞行到指定经纬度，duration 毫秒内做 easeInOutCubic 插值。
// onDone 在飞行结束时回调——点击后要等它跑完再跳详情页，
// 否则组件一卸载，插值跟着消失，镜头移动用户根本看不见。
const flyTo = (lon, lat, distance = 3.2, duration = FLY_DURATION, onDone = null) => {
  if (!camera || !controls) {
    onDone?.()
    return
  }
  const target = new THREE.Vector3(...lonLatToCartesian(lon, lat, 1))
  // 地球网格随 earth.rotation.y 旋转，目标点要跟着一起转
  if (earth) target.applyAxisAngle(new THREE.Vector3(0, 1, 0), earth.rotation.y)
  target.multiplyScalar(distance)

  flight = {
    from: camera.position.clone(),
    to: target,
    start: performance.now(),
    duration,
    onDone,
  }
  // 暂停自转，否则目标在飞行途中会飘走
  autoRotate.value = false
}

// 首屏视角：相机站到中国中部（lon 105 / lat 33）正对球心。
// 距离 3.6 时球面视角半径 asin(2/3.6)=33.8°，小于垂直半 FOV 37.5°，整球完整可见。
const FOCUS = { lon: 105, lat: 33, distance: 3.6 }

const focusOnChina = () => {
  // 用经纬度反解相机位置
  const [x, y, z] = lonLatToCartesian(FOCUS.lon, FOCUS.lat, FOCUS.distance)
  camera.position.set(x, y, z)
  controls.target.set(0, 0, 0)
  controls.update()
}

const animate = () => {
  animationId = requestAnimationFrame(animate)

  // 拾取：每帧至多一次，合并掉高频指针事件
  doPick()

  // 球面省名标注
  updateProvinceLabels()

  // 地球自转（约 0.68°/s）
  //
  // 相机必须跟着转同样的角度：只转地球网格的话，地表会从相机下面溜走——
  // 实测自转 60 秒后中国中心就偏离视轴 34°，两分钟后跑到 66°。
  // 相机同步旋转后，相机在地球局部坐标系里的经纬度保持不变，
  // 屏幕中心始终对着原来那块地，遥测读数也跟着稳定下来。
  //
  // 用时间而不是帧数推进：按帧加固定增量会让自转速度随屏幕刷新率变
  // （144Hz 下是 1.65°/s，30Hz 下是 0.34°/s），而 HUD 上写的是 0.68°/s。
  if (earth && autoRotate.value && camera) {
    const now = performance.now()
    // 首帧没有时间差；切标签页回来时 delta 会很大，钳一下避免跳一大步
    const delta = lastSpinAt ? Math.min(0.1, (now - lastSpinAt) / 1000) : 0
    lastSpinAt = now
    const step = SPIN_RATE * delta
    earth.rotation.y += step
    camera.position.applyAxisAngle(SPIN_AXIS, step)
  } else {
    lastSpinAt = 0
  }

  // 遥测读数：节流到 200ms 一次，避免每帧触发响应式更新
  const now = performance.now()
  if (now - lastTelemetryAt > 200) {
    lastTelemetryAt = now
    updateTelemetry()
  }

  // 相机飞行插值
  if (flight) {
    const t = Math.min(1, (performance.now() - flight.start) / flight.duration)
    const eased = easeInOutCubic(t)
    camera.position.lerpVectors(flight.from, flight.to, eased)
    if (t >= 1) {
      // 飞行结束才跳详情页，否则组件一卸载，插值跟着消失，镜头移动用户看不见
      const done = flight.onDone
      flight = null
      done?.()
    }
  }

  // 星星闪烁效果（逐顶点 aSize，材质已接管 gl_PointSize）
  if (twinkleStars && starSizes && starGeometry && !prefersReducedMotion) {
    const time = Date.now() * 0.001
    twinkleStars.forEach((starIndex, index) => {
      const starTime = time + index * 0.1
      const twinkle = Math.sin(starTime * 2) * 0.2 + 0.8 // 减缓闪烁频率和幅度
      starSizes[starIndex] = (0.8 + Math.random() * 1.4) * twinkle
    })
    starGeometry.attributes.aSize.needsUpdate = true
  }

  // 控制星空移动 - 让星空移动更缓慢
  if (stars) {
    // 获取相机旋转角度，但只使用一小部分来移动星空
    const cameraRotation = camera.rotation
    const slowFactor = 0.1 // 星空移动速度因子，越小移动越慢

    // 让星空以相机旋转的10%速度反向移动，创造相对静止效果
    stars.rotation.x = -cameraRotation.x * slowFactor
    stars.rotation.y = -cameraRotation.y * slowFactor
  }

  controls.update()
  renderer.render(scene, camera)
}
</script>

<style scoped>
.earth-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  cursor: crosshair;
}

/* 深空底纹：中心微亮 + 边缘压暗，让球体更突出 */
.earth-container::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 50% 45%, rgba(79, 216, 255, 0.07) 0%, transparent 55%),
    radial-gradient(circle at 50% 50%, transparent 55%, rgba(2, 5, 12, 0.55) 100%);
  z-index: 1;
}

/* ---------- HUD 覆盖层 ---------- */
.hud {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

.hud > *:not(.lock) {
  pointer-events: auto;
}

.hud__telemetry {
  position: absolute;
  top: var(--sp-4);
  left: var(--sp-4);
  width: 198px;
  animation: hud-in var(--dur-slow) var(--ease) both;
}

.hud__legend {
  position: absolute;
  top: var(--sp-4);
  right: var(--sp-4);
  animation: hud-in var(--dur-slow) var(--ease) both 120ms;
}

.telemetry {
  display: grid;
  gap: var(--sp-1);
  margin: 0;
}

.telemetry__row {
  display: flex;
  align-items: baseline;
  gap: var(--sp-2);
}

.telemetry dt {
  width: 28px;
  flex: none;
  font-size: var(--fs-label);
  letter-spacing: 0.12em;
  color: var(--text-lo);
}

.telemetry dd {
  margin: 0;
  font-size: var(--fs-label);
  color: var(--text-hi);
}

.telemetry dd.is-on {
  color: var(--accent);
}

.hud__hint {
  position: absolute;
  left: var(--sp-4);
  bottom: var(--sp-4);
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.1em;
  color: var(--text-lo);
  animation: hud-in var(--dur-slow) var(--ease) both 200ms;
}

.hud__hint span {
  margin-left: var(--sp-3);
  color: var(--accent);
  opacity: 0.75;
}

.hud__hint span:first-child {
  margin-left: 0;
}

/* 右下角一组控件：全球视角、省名标注开关、许可链接 */
.hud__corner {
  position: absolute;
  right: var(--sp-4);
  bottom: var(--sp-4);
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}

/* 切到全球视角 */
.hud__world-link {
  padding: 6px 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: rgba(4, 7, 15, 0.6);
  color: var(--text-mid);
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.16em;
  cursor: pointer;
  transition: color var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease),
    background var(--dur-fast) var(--ease);
}

.hud__world-link:hover {
  color: var(--accent);
  border-color: var(--line-strong);
  background: var(--accent-dim);
}

/* 省名标注开关 */
.hud__labels-toggle {
  padding: 5px 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--bg-panel);
  color: var(--text-mid);
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.12em;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: color var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease);
}

.hud__labels-toggle:hover {
  color: var(--accent);
  border-color: var(--line-strong);
}

.hud__labels-toggle span {
  margin-left: 8px;
  color: var(--accent);
}

/* 许可链接：与两个按钮同一组，排在最右 */
.hud__corner-link {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.12em;
  color: var(--text-lo);
  text-decoration: none;
  transition: color var(--dur-fast) var(--ease);
}

.hud__corner-link:hover {
  color: var(--accent);
}

/* ---------- 数据加载状态 ---------- */
.scene-status {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.scene-status__box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-4) var(--sp-5);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--bg-panel);
  backdrop-filter: blur(8px);
  box-shadow: var(--glow-soft);
  pointer-events: auto;
}

.scene-status__spinner {
  width: 22px;
  height: 22px;
  border: 2px solid var(--accent-soft);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: scene-spin 900ms linear infinite;
}

.scene-status__text {
  margin: 0;
  color: var(--text-mid);
}

.scene-status__text--error {
  color: #ff9a9a;
}

.scene-status__retry {
  padding: 6px 20px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  background: var(--accent-dim);
  color: var(--text-hi);
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.12em;
  cursor: pointer;
}

.scene-status__retry:hover {
  background: rgba(79, 216, 255, 0.2);
}

@keyframes scene-spin {
  to {
    transform: rotate(360deg);
  }
}

/* ---------- 锁定标注：准星 + 引线 + 标签 ---------- */
.lock {
  position: absolute;
  width: 0;
  height: 0;
  pointer-events: none;
}

.lock__reticle {
  position: absolute;
  left: -13px;
  top: -13px;
  width: 26px;
  height: 26px;
  border: 1px solid var(--accent);
  border-radius: 50%;
  box-shadow: var(--glow);
  animation: lock-breathe 2s var(--ease) infinite;
}

.lock__reticle::before,
.lock__reticle::after {
  content: '';
  position: absolute;
  background: var(--accent);
  opacity: 0.45;
}

.lock__reticle::before {
  left: 50%;
  top: -7px;
  width: 1px;
  height: 38px;
  transform: translateX(-50%);
}

.lock__reticle::after {
  top: 50%;
  left: -7px;
  height: 1px;
  width: 38px;
  transform: translateY(-50%);
}

.lock__leader {
  position: absolute;
  left: 13px;
  top: -13px;
  width: 36px;
  height: 1px;
  background: linear-gradient(90deg, var(--accent), transparent);
  transform-origin: left center;
  transform: rotate(-34deg);
}

.lock__tag {
  position: absolute;
  left: 44px;
  top: -42px;
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: 3px var(--sp-2);
  white-space: nowrap;
  background: var(--bg-panel);
  border: 1px solid var(--accent-soft);
  border-radius: var(--radius-sm);
  backdrop-filter: blur(6px);
  box-shadow: var(--glow-soft);
}

.lock__name {
  font-size: var(--fs-body);
  color: var(--text-hi);
}

.lock__code {
  font-size: var(--fs-label);
  color: var(--accent);
  opacity: 0.85;
}

/* 指针靠近右缘时标注翻到左侧，避免出屏 */
.lock--flip .lock__leader {
  left: -13px;
  transform: rotate(34deg) scaleX(-1);
}

.lock--flip .lock__tag {
  left: auto;
  right: 44px;
}

@keyframes hud-in {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes lock-breathe {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.14);
    opacity: 0.55;
  }
}
</style>
