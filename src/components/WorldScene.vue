<template>
  <div ref="container" class="world-scene">
    <canvas ref="canvasRef" class="world-scene__canvas"></canvas>

    <!-- 左上角遥测 -->
    <div class="hud hud--telemetry">
      <div class="hud__head">
        <span class="hud__dot"></span><span>遥测</span><span class="hud__mono">TELEMETRY</span>
      </div>
      <div class="hud__row"><span>中心</span><b class="hud__mono" ref="telemetryCenter">—</b></div>
      <div class="hud__row"><span>视距</span><b class="hud__mono" ref="telemetryDistance">—</b></div>
      <div class="hud__row"><span>自转</span><b class="hud__mono" ref="telemetryRotation">—</b></div>
    </div>

    <!-- 顶部面包屑 -->
    <nav class="hud hud--crumb">
      <button type="button" class="hud__crumb-link" @click="goHome">‹ 全球</button>
      <template v-if="focused">
        <span class="hud__crumb-sep">/</span>
        <span class="hud__crumb-current">{{ focused }}</span>
      </template>
    </nav>

    <!-- 右上角国家列表 -->
    <div class="hud hud--countries">
      <div class="hud__head">
        <span class="hud__dot"></span><span>国家 / 地区</span>
        <span class="hud__mono">{{ countries.length }}</span>
      </div>
      <input
        v-model="keyword"
        class="hud__search"
        type="search"
        placeholder="按名称 / ISO 代码过滤"
        aria-label="按名称或 ISO 代码过滤国家"
      />
      <ul class="hud__list">
        <li v-for="country in visibleCountries" :key="country.id" class="hud__item">
          <button type="button" @click="selectCountry(country)">
            <span class="hud__swatch" :style="{ background: country.color }"></span>
            <span class="hud__name">{{ country.name }}</span>
            <span class="hud__mono hud__code">{{ country.id }}</span>
          </button>
        </li>
      </ul>
    </div>

    <!-- 加载态 / 错误态 -->
    <div v-if="status === 'loading'" class="hud hud--state">读取世界国界数据…</div>
    <div v-else-if="status === 'error'" class="hud hud--state hud--state--error">
      <p>{{ error }}</p>
      <button type="button" class="hud__retry" @click="load">重试</button>
    </div>

    <!-- 底部提示 -->
    <div class="hud hud--hint">
      <span>拖拽 旋转</span><span>滚轮 缩放</span><span>点击 国家</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import { createProvinceMeshFromFeature, lonLatToCartesian } from '../utils/geoDataProcessor'
import {
  LABEL_RADIUS,
  LABEL_BASE_HEIGHT,
  createLabelTexture,
  labelOpacity,
  labelHeight,
  labelPosition,
  featureSizeProxy,
  labelPixelHeight,
  rectsOverlap,
  cameraDirectionInEarthFrame,
  cameraLonLat,
  formatLonLat,
  earthLocalToWorld,
} from '../utils/provinceLabels'
import { isClickGesture } from '../utils/gesture'
import {
  loadWorldCountries,
  countryId,
  countryName,
  regionColor,
  regionColorCss,
  featureCenter,
} from '../utils/worldData'

const router = useRouter()
const container = ref(null)
const canvasRef = ref(null)

const status = ref('loading')
const error = ref('')
const keyword = ref('')
const focused = ref('')
const countries = ref([])

let scene = null
let camera = null
let renderer = null
let controls = null
let earth = null
let countryGroup = null
let labelGroup = null
let animationFrame = 0
/** 相机飞行的 rAF 句柄，卸载时要取消 */
let flightFrame = 0
/** 组件是否已卸载。异步加载完成后要检查，避免往已销毁的场景里加对象 */
let disposed = false
/** 地球自转：每秒的弧度（约 0.68°/s） */
const SPIN_RATE = 0.012
/** 自转轴：Y 轴 */
const SPIN_AXIS = new THREE.Vector3(0, 1, 0)
/** 上一次推进自转的时间戳 */
let lastSpinAt = 0
let canvasRect = { left: 0, top: 0, width: 1, height: 1 }
// 地球自转：每帧 0.0002 弧度，约 0.68°/s，与地球页一致
let autoRotate = true
let reducedMotionQuery = null
const pickRaycaster = new THREE.Raycaster()
const pickNdc = new THREE.Vector2()

const onReducedMotionChange = (event) => {
  autoRotate = !event.matches
}

const visibleCountries = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  if (!key) return countries.value
  return countries.value.filter(
    (c) => c.name.toLowerCase().includes(key) || c.id.toLowerCase().includes(key),
  )
})

// 遥测读数走命令式 DOM 写入：它每帧都在变，走响应式会带着 177 项列表一起重渲染。
const telemetryCenter = ref(null)
const telemetryDistance = ref(null)
const telemetryRotation = ref(null)

const updateTelemetry = () => {
  if (!camera || !earth) return
  if (telemetryCenter.value) {
    const [lon, lat] = cameraLonLat(camera.position, earth.rotation.y)
    telemetryCenter.value.textContent = formatLonLat(lon, lat)
  }
  if (telemetryDistance.value) {
    telemetryDistance.value.textContent = `${camera.position.length().toFixed(2)} R`
  }
  if (telemetryRotation.value) {
    telemetryRotation.value.textContent = autoRotate ? 'ON 0.68°/s' : 'HOLD'
  }
}

const goHome = () => router.push('/')

const selectCountry = (country) => {
  flyTo(country.center[0], country.center[1], 2.4)
  focused.value = country.name
  router.push(`/country/${country.id}`)
}

/** 相机飞行到指定经纬度 */
const flyTo = (lon, lat, distance = 2.6, duration = 900) => {
  if (!camera || !controls) return
  const target = new THREE.Vector3(...lonLatToCartesian(lon, lat, 1))
  // 地球绕 Y 轴自转，目标点要跟着一起转
  const angle = earth.rotation.y
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const rotated = new THREE.Vector3(
    target.x * cos + target.z * sin,
    target.y,
    -target.x * sin + target.z * cos,
  )
  const to = rotated.multiplyScalar(distance)
  const from = camera.position.clone()
  const start = performance.now()
  // 暂停自转，否则目标在飞行途中会飘走
  autoRotate = false

  // 句柄要留着：组件卸载时必须取消，否则回调会继续往已置 null 的 camera 上写
  cancelAnimationFrame(flightFrame)
  const tick = () => {
    if (!camera || !controls) return
    const t = Math.min(1, (performance.now() - start) / duration)
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    camera.position.lerpVectors(from, to, eased)
    controls.target.set(0, 0, 0)
    if (t < 1) flightFrame = requestAnimationFrame(tick)
  }
  flightFrame = requestAnimationFrame(tick)
}

/** 星空：随机撒点，给全球视角一个空间感 */
const createStars = () => {
  const count = 4000
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const radius = 60 + Math.random() * 40
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = radius * Math.cos(phi)
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, sizeAttenuation: true })
  return new THREE.Points(geometry, material)
}

const initThree = () => {
  const { clientWidth, clientHeight } = container.value
  scene = new THREE.Scene()
  scene.add(createStars())

  camera = new THREE.PerspectiveCamera(75, clientWidth / clientHeight, 0.1, 1000)
  // 初始视角：欧非大陆一带，整球可见（asin(2/5)=23.6°，小于半 FOV 37.5°）
  camera.position.set(...lonLatToCartesian(20, 10, 5))

  renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvasRef.value })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(clientWidth, clientHeight)

  scene.add(new THREE.AmbientLight(0xffffff, 0.6))
  const sun = new THREE.DirectionalLight(0xffffff, 0.9)
  sun.position.set(5, 2, 3)
  scene.add(sun)

  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(2, 64, 64),
    new THREE.MeshPhongMaterial({
      // 与地球页同一张卫星贴图：两个视角是同一个产品，视觉语言必须一致
      map: new THREE.TextureLoader().load('/textures/earth_atmos_2048.jpg'),
      color: 0xffffff,
      specular: new THREE.Color(0x333333),
      shininess: 10,
    }),
  )
  scene.add(globe)
  earth = globe

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true

  // 系统的「减少动态效果」：关掉自转，其余交互保留
  reducedMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)')
  autoRotate = !reducedMotionQuery?.matches
  reducedMotionQuery?.addEventListener?.('change', onReducedMotionChange)

  updateCanvasRect()
  window.addEventListener('resize', onResize)
  renderer.domElement.addEventListener('mousedown', onMouseDown)
  renderer.domElement.addEventListener('mousemove', onMouseMove)
  renderer.domElement.addEventListener('mouseup', onMouseUp)
  renderer.domElement.addEventListener('mouseleave', onMouseLeave)
}

const updateCanvasRect = () => {
  if (!container.value) return
  const rect = container.value.getBoundingClientRect()
  canvasRect = { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
}

const onResize = () => {
  if (!container.value || !renderer || !camera) return
  const { clientWidth, clientHeight } = container.value
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight)
  updateCanvasRect()
}

/** 射线拾取：找出点到的国家 */
const pickCountry = (event) => {
  if (!countryGroup) return null
  const ndcX = ((event.clientX - canvasRect.left) / canvasRect.width) * 2 - 1
  const ndcY = -((event.clientY - canvasRect.top) / canvasRect.height) * 2 + 1
  pickRaycaster.setFromCamera(pickNdc.set(ndcX, ndcY), camera)
  const hits = pickRaycaster.intersectObjects(countryGroup.children, false)
  for (const hit of hits) {
    if (hit.object.userData.isCountry) return hit.object.userData
  }
  return null
}

let mouseDownTime = 0
let mouseDownPosition = { x: 0, y: 0 }

const onMouseDown = (event) => {
  mouseDownTime = Date.now()
  mouseDownPosition = { x: event.clientX, y: event.clientY }
}

const onMouseMove = (event) => {
  const data = pickCountry(event)
  if (renderer) renderer.domElement.style.cursor = data ? 'pointer' : 'grab'
}

const onMouseUp = (event) => {
  const duration = Date.now() - mouseDownTime
  const distance = Math.sqrt(
    (event.clientX - mouseDownPosition.x) ** 2 + (event.clientY - mouseDownPosition.y) ** 2,
  )
  if (isClickGesture(duration, distance)) {
    const data = pickCountry(event)
    if (data) {
      flyTo(data.center[0], data.center[1], 2.4)
      focused.value = data.name
      router.push(`/country/${data.id}`)
    }
  }
  mouseDownTime = 0
}

const onMouseLeave = () => {
  if (renderer) renderer.domElement.style.cursor = 'grab'
}

/** 建面：每个国家一个 mesh */
const createCountryMeshes = (geoJson) => {
  const group = new THREE.Group()
  for (const feature of geoJson.features) {
    const id = countryId(feature)
    const name = countryName(feature)
    if (!id || !name) continue
    const center = featureCenter(feature)
    if (!center) continue

    const mesh = createProvinceMeshFromFeature(feature, {
      radius: 2,
      elevation: 0.015,
      materialOptions: {
        // 按联合国次区域分区上色，与中国视角「按地理分区」同一套设计语言
        color: regionColor(feature),
        transparent: true,
        // 压低不透明度，让卫星底图透出来
        opacity: 0.45,
        shininess: 20,
      },
      lineColor: 0xffffff,
    })
    if (!mesh) continue
    mesh.userData = { ...(mesh.userData || {}), isCountry: true, id, name, center }
    group.add(mesh)
  }
  return group
}

/** 建国名标注 */
const createCountryLabels = (geoJson) => {
  const group = new THREE.Group()
  for (const feature of geoJson.features) {
    const id = countryId(feature)
    const name = countryName(feature)
    if (!id || !name) continue
    const center = featureCenter(feature)
    if (!center) continue

    const { texture, width, height } = createLabelTexture(name)
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      opacity: 0,
    })
    const sprite = new THREE.Sprite(material)
    const [x, y, z] = labelPosition(center, LABEL_RADIUS)
    sprite.position.set(x, y, z)
    sprite.renderOrder = 2
    sprite.userData = {
      id,
      name,
      aspect: width / height,
      priority: featureSizeProxy(feature),
    }
    group.add(sprite)
  }
  return group
}

/** 每帧更新标注：背面不显示、尺寸随距离恒定、屏幕空间去重叠 */
const updateLabels = () => {
  if (!labelGroup || !camera || !earth) return
  const camDir = cameraDirectionInEarthFrame(camera.position, earth.rotation.y)
  const pixelH = labelPixelHeight(LABEL_BASE_HEIGHT, camera.fov, canvasRect.height)
  const world = new THREE.Vector3()
  const ndc = new THREE.Vector3()

  const candidates = []
  for (const sprite of labelGroup.children) {
    // sprite.position 是地球局部坐标，相机在世界坐标：
    // 地球自转后两者不在同一套坐标系里，背面判定要用局部坐标，
    // 投影与距离必须先转到世界坐标。
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
      x: (ndc.x * 0.5 + 0.5) * canvasRect.width,
      y: (-ndc.y * 0.5 + 0.5) * canvasRect.height,
    })
  }

  // 大国先占位，小国与已放置标签重叠就让位
  candidates.sort((a, b) => b.priority - a.priority)
  const placed = []
  for (const item of candidates) {
    const halfW = (pixelH * item.aspect) / 2 + 3
    const halfH = pixelH / 2 + 3
    const box = { l: item.x - halfW, r: item.x + halfW, t: item.y - halfH, b: item.y + halfH }

    if (placed.some((other) => rectsOverlap(box, other))) {
      item.sprite.visible = false
      continue
    }
    placed.push(box)

    item.sprite.visible = true
    item.sprite.material.opacity = item.opacity
    const height = labelHeight(item.distance)
    item.sprite.scale.set(height * item.aspect, height, 1)
  }
}

const animate = () => {
  animationFrame = requestAnimationFrame(animate)
  if (controls) controls.update()
  // 地球自转（约 0.68°/s）
  //
  // 相机必须跟着转同样的角度：只转地球网格的话，地表会从相机下面溜走——
  // 实测自转 60 秒后目标中心就偏离视轴 34°。
  //
  // 用时间而不是帧数推进：按帧加固定增量会让自转速度随屏幕刷新率变。
  if (earth && autoRotate && camera) {
    const now = performance.now()
    const delta = lastSpinAt ? Math.min(0.1, (now - lastSpinAt) / 1000) : 0
    lastSpinAt = now
    const step = SPIN_RATE * delta
    earth.rotation.y += step
    camera.position.applyAxisAngle(SPIN_AXIS, step)
  } else {
    lastSpinAt = 0
  }
  updateLabels()
  updateTelemetry()
  if (renderer && scene && camera) renderer.render(scene, camera)
}

const load = async () => {
  status.value = 'loading'
  error.value = ''
  try {
    const geoJson = await loadWorldCountries()
    // 加载期间可能已经离开这个页面：这时不能再往场景里加对象
    if (disposed || !earth) return
    if (countryGroup) {
      earth.remove(countryGroup)
      disposeGroup(countryGroup)
    }
    if (labelGroup) {
      earth.remove(labelGroup)
      disposeGroup(labelGroup)
    }
    countryGroup = createCountryMeshes(geoJson)
    labelGroup = createCountryLabels(geoJson)
    earth.add(countryGroup)
    earth.add(labelGroup)

    countries.value = geoJson.features
      .map((feature) => {
        const id = countryId(feature)
        const name = countryName(feature)
        const center = featureCenter(feature)
        return center ? { id, name, center, color: regionColorCss(feature) } : null
      })
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))

    status.value = 'ready'
  } catch (e) {
    error.value = `世界国界数据加载失败：${e.message}`
    status.value = 'error'
  }
}

const disposeGroup = (group) => {
  group.traverse((object) => {
    if (object.geometry) object.geometry.dispose()
    const material = object.material
    if (!material) return
    const list = Array.isArray(material) ? material : [material]
    for (const item of list) {
      if (item.map) item.map.dispose()
      item.dispose()
    }
  })
}

onMounted(async () => {
  await nextTick()
  initThree()
  animate()
  await load()
})

onUnmounted(() => {
  disposed = true
  cancelAnimationFrame(animationFrame)
  cancelAnimationFrame(flightFrame)
  window.removeEventListener('resize', onResize)
  reducedMotionQuery?.removeEventListener?.('change', onReducedMotionChange)
  if (renderer) {
    renderer.domElement.removeEventListener('mousedown', onMouseDown)
    renderer.domElement.removeEventListener('mousemove', onMouseMove)
    renderer.domElement.removeEventListener('mouseup', onMouseUp)
    renderer.domElement.removeEventListener('mouseleave', onMouseLeave)
  }
  if (countryGroup) disposeGroup(countryGroup)
  if (labelGroup) disposeGroup(labelGroup)
  // 球体、星空与卫星贴图也要释放——每次进出这个页面都会漏一份
  if (scene) disposeGroup(scene)
  if (controls) controls.dispose()
  if (renderer) renderer.dispose()
  scene = null
  camera = null
  renderer = null
  controls = null
  earth = null
  countryGroup = null
  labelGroup = null
})
</script>

<style scoped>
.world-scene {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--bg-void);
}

.world-scene__canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab;
}

/* HUD 覆盖层：与地球页同一套设计令牌，但自带样式（那边的样式是 scoped 的） */
.hud {
  position: absolute;
  z-index: 2;
  padding: var(--sp-3) var(--sp-4);
  border: 1px solid var(--line-faint);
  border-radius: var(--radius);
  background: rgba(4, 7, 15, 0.68);
  backdrop-filter: blur(10px);
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  color: var(--text-mid);
  animation: hud-in var(--dur-slow) var(--ease) both 200ms;
}

.hud__head {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin-bottom: var(--sp-2);
  padding-bottom: var(--sp-2);
  border-bottom: 1px solid var(--line-faint);
  letter-spacing: 0.16em;
  color: var(--text-hi);
}

.hud__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: var(--glow-soft);
}

.hud__mono {
  font-family: var(--font-mono);
  letter-spacing: 0.1em;
  color: var(--text-lo);
}

.hud__row {
  display: flex;
  justify-content: space-between;
  gap: var(--sp-4);
  padding: 2px 0;
  letter-spacing: 0.1em;
}

.hud__row b {
  color: var(--text-hi);
  font-weight: 400;
}

.hud--telemetry {
  top: var(--sp-4);
  left: var(--sp-4);
  min-width: 210px;
}

.hud--crumb {
  top: var(--sp-4);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: 6px var(--sp-4);
}

.hud__crumb-link {
  border: none;
  background: transparent;
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.12em;
  cursor: pointer;
}

.hud__crumb-link:hover {
  color: var(--text-hi);
}

.hud__crumb-sep {
  color: var(--text-lo);
}

.hud__crumb-current {
  color: var(--text-hi);
}

.hud--countries {
  top: var(--sp-4);
  right: var(--sp-4);
  width: 260px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.hud__search {
  width: 100%;
  margin-bottom: var(--sp-2);
  padding: 4px 8px;
  border: 1px solid var(--line-faint);
  border-radius: var(--radius-sm);
  background: rgba(0, 0, 0, 0.3);
  color: var(--text-hi);
  font-family: var(--font-mono);
  font-size: var(--fs-label);
}

.hud__search::placeholder {
  color: var(--text-lo);
}

.hud__list {
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-y: auto;
  flex: 1;
}

.hud__item button {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  width: 100%;
  padding: 3px 4px;
  border: none;
  background: transparent;
  color: var(--text-mid);
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  text-align: left;
  cursor: pointer;
}

.hud__item button:hover {
  color: var(--text-hi);
  background: rgba(79, 216, 255, 0.1);
}

.hud__swatch {
  width: 8px;
  height: 8px;
  flex: none;
  border-radius: 2px;
}

.hud__name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hud__code {
  color: var(--text-lo);
}

.hud--state {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  letter-spacing: 0.16em;
  color: var(--text-lo);
}

.hud--state--error {
  color: #ff9a9a;
}

.hud__retry {
  margin-top: var(--sp-2);
  padding: 5px 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-mid);
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.12em;
  cursor: pointer;
}

.hud--hint {
  left: var(--sp-4);
  bottom: var(--sp-4);
  display: flex;
  gap: var(--sp-3);
  letter-spacing: 0.1em;
  color: var(--text-lo);
}

.hud--hint span {
  color: var(--accent);
  opacity: 0.75;
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
</style>
