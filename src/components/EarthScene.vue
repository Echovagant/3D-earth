<template>
  <div ref="container" class="earth-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useRouter } from 'vue-router'
import { createProvinceMeshFromFeature, lonLatToCartesian } from '../utils/geoDataProcessor'

const container = ref(null)
const router = useRouter()

// 组件级状态：原先星空相关状态被挂到了 window 上，既污染全局又无法随组件释放
let scene, camera, renderer, earth, controls, animationId
let provinceGroup = null
let stars = null
let starGeometry = null
let starSizes = null
let twinkleStars = null
let removePointerListeners = null

onMounted(() => {
  initThree()
  initEarth()
  initControls()
  initProvinces() // 初始化中国省份地图
  initRaycaster()
  window.addEventListener('resize', onResize)
  animate()
  focusOnChina() // 初始视角聚焦中国
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  removePointerListeners?.()
  controls?.dispose()
  disposeScene()
  renderer?.dispose()
})

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

  // 创建星空背景
  createStarfield()
}

const initEarth = () => {
  // 创建地球材质和几何体
  const geometry = new THREE.SphereGeometry(2, 64, 64)
  const textureLoader = new THREE.TextureLoader()
  // 使用占位贴图（项目 public/textures 中会提供真实贴图）
  const earthTexture = textureLoader.load(
    '/textures/earth_atmos_2048.jpg',
    undefined,
    undefined,
    () => {
      console.warn('地球贴图加载失败，使用纯色材质')
    },
  )

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
  // 没有逐顶点大小属性。原先把逐顶点 'size' 写进去、每帧改写并标记 needsUpdate，
  // 视觉上完全不起作用，只白白触发一次 GPU buffer 上传。
  // 这里注入 aSize 属性并接管 gl_PointSize 的赋值，闪烁才真正生效。
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

const initProvinces = async () => {
  try {
    // 加载中国省份GeoJSON数据
    const response = await fetch('/geojson/china-provinces.json')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const geoJson = await response.json()

    // 将GeoJSON数据转换为3D对象并添加到地球
    provinceGroup = createProvincesFromGeoJson(geoJson)
    earth.add(provinceGroup)
  } catch (error) {
    console.error('加载省份数据失败:', error)
  }
}

const createProvincesFromGeoJson = (geoJson) => {
  const group = new THREE.Group()

  // 定义省份颜色数组，让每个省份有不同颜色
  const provinceColors = [
    0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xfeca57, 0xff9ff3, 0x54a0ff, 0x5f27cd, 0x00d2d3,
    0xff9f43, 0x10ac84, 0xee5a24, 0xa3cb38, 0xc44569, 0xd980fa,
  ]

  geoJson.features.forEach((feature, index) => {
    const { name, adcode } = feature.properties
    const colorIndex = index % provinceColors.length

    // 使用工具函数将 GeoJSON 转为贴合球面的 BufferGeometry Mesh
    const mesh = createProvinceMeshFromFeature(feature, {
      radius: 2,
      elevation: 0.02,
      materialOptions: {
        color: provinceColors[colorIndex],
        transparent: true,
        opacity: 0.7, // 降低透明度让轮廓更明显
        shininess: 30,
      },
      lineColor: 0xffffff, // 白色轮廓
      lineWidth: 2,
    })
    if (mesh) {
      // ensure province metadata is present
      mesh.userData = Object.assign(mesh.userData || {}, {
        provinceName: name,
        adcode: adcode,
        isProvince: true,
      })
      group.add(mesh)
    }
  })

  return group
}

const initRaycaster = () => {
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  let isDragging = false
  let mouseDownTime = 0
  let mouseDownPosition = { x: 0, y: 0 }
  let hoveredProvince = null
  let highlightMaterial = null
  const originalMaterials = new Map()

  // 只对省份组求交：原先对整个 scene 递归求交，会连 5000 个点的星空一起算，
  // 而每次 mousemove 都会触发一次
  const pickProvinces = () => {
    if (!provinceGroup) return []
    return raycaster.intersectObjects(provinceGroup.children, false)
  }

  const onMouseDown = (event) => {
    isDragging = false
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
    if (clickDuration < 200 && moveDistance < 5 && !isDragging) {
      handleValidClick(event)
    }

    mouseDownTime = 0
    isDragging = false
  }

  const onMouseMove = (event) => {
    if (mouseDownTime > 0) {
      isDragging = true
    }
    // 更新鼠标位置
    const rect = renderer.domElement.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    // 更新射线
    raycaster.setFromCamera(mouse, camera)

    // 检测悬停对象
    const intersects = pickProvinces()

    let currentHovered = null
    for (const intersect of intersects) {
      if (intersect.object.userData.isProvince) {
        currentHovered = intersect.object
        break
      }
    }

    // 处理悬停状态变化
    if (currentHovered !== hoveredProvince) {
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
      if (currentHovered) {
        originalMaterials.set(currentHovered, currentHovered.material)

        // 创建高亮材质
        highlightMaterial = currentHovered.material.clone()
        highlightMaterial.emissive = new THREE.Color(0x444444) // 添加自发光效果
        highlightMaterial.opacity = 0.9

        currentHovered.material = highlightMaterial
      }

      hoveredProvince = currentHovered
    }
  }

  const handleValidClick = (event) => {
    // 将鼠标位置归一化为-1到1的范围
    const rect = renderer.domElement.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    // 通过相机和鼠标位置更新射线
    raycaster.setFromCamera(mouse, camera)

    // 计算与射线相交的物体
    const intersects = pickProvinces()

    for (const intersect of intersects) {
      if (intersect.object.userData.isProvince) {
        const provinceName = intersect.object.userData.provinceName
        handleProvinceClick(provinceName)
        break
      }
    }
  }

  renderer.domElement.addEventListener('mousedown', onMouseDown)
  renderer.domElement.addEventListener('mousemove', onMouseMove)
  renderer.domElement.addEventListener('mouseup', onMouseUp)

  // 卸载时解绑：原先只注册不解绑，组件反复挂载会叠加监听器
  removePointerListeners = () => {
    renderer.domElement.removeEventListener('mousedown', onMouseDown)
    renderer.domElement.removeEventListener('mousemove', onMouseMove)
    renderer.domElement.removeEventListener('mouseup', onMouseUp)
  }
}

const handleProvinceClick = (provinceName) => {
  // 使用路由跳转到省份页面
  router.push(`/province/${provinceName}`)
}

// 首屏视角：相机站到中国中部（lon 105 / lat 33）正对球心。
// 距离 3.6 时球面视角半径 asin(2/3.6)=33.8°，小于垂直半 FOV 37.5°，整球完整可见。
const FOCUS = { lon: 105, lat: 33, distance: 3.6 }

const focusOnChina = () => {
  // 之前这里硬编码 new THREE.Vector3(-1.2, 0.3, 1.8)，
  // 换算成经纬度是 lon -123.7 / lat 7.9 —— 太平洋，不是中国。
  const [x, y, z] = lonLatToCartesian(FOCUS.lon, FOCUS.lat, FOCUS.distance)
  camera.position.set(x, y, z)
  controls.target.set(0, 0, 0)
  controls.update()
}

const animate = () => {
  animationId = requestAnimationFrame(animate)

  // 地球自转（约 0.68°/s）。原先 0.001/帧 ≈ 3.4°/s，中国十几秒就转出视野。
  if (earth) earth.rotation.y += 0.0002

  // 星星闪烁效果（逐顶点 aSize，材质已接管 gl_PointSize）
  if (twinkleStars && starSizes && starGeometry) {
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
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
