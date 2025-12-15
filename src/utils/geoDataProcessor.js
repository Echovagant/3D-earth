// GeoJSON 数据处理工具：将 GeoJSON 多边形三角化并映射到球面
import * as THREE from 'three'
import earcut from 'earcut'

/**
 * 将经纬度（lon, lat）转换为球面坐标 (x, y, z)
 * radius: 地球半径
 */
export function lonLatToCartesian(lon, lat, radius = 2) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)

  const x = -(Math.sin(phi) * Math.cos(theta)) * radius
  const y = Math.cos(phi) * radius
  const z = Math.sin(phi) * Math.sin(theta) * radius

  return [x, y, z]
}

/**
 * 创建一个贴合球面的省份 Mesh（BufferGeometry），使用 earcut 进行三角化。
 * 支持 Polygon 和 MultiPolygon。
 * feature: GeoJSON Feature
 * options: { radius, elevation, materialOptions }
 */
export function createProvinceMeshFromFeature(feature, options = {}) {
  const { radius = 2, elevation = 0.02, materialOptions = {} } = options

  const geomPositions = [] // will hold flattened triangle vertex coords

  const geom3DVertices = [] // temporary list of vertex 3D coords per feature (indexed by order added)

  // helper to process a single polygon (array of rings)
  const processPolygon = (rings) => {
    const flat2D = [] // [x0,y0, x1,y1, ...] for earcut
    const holeIndices = []

    // For mapping 2D indices back to 3D coords, push 3D per coordinate in same order
    rings.forEach((ring, rIndex) => {
      if (rIndex > 0) {
        // hole start index is current number of points
        holeIndices.push(flat2D.length / 2)
      }

      ring.forEach((coord) => {
        const [lon, lat] = coord
        flat2D.push(lon, lat)
        const [x, y, z] = lonLatToCartesian(lon, lat, radius + elevation)
        geom3DVertices.push([x, y, z])
      })
    })

    // earcut triangulation (on equirectangular lon/lat plane)
    const triangles = earcut(flat2D, holeIndices, 2)

    // Build triangle vertex positions using triangulation indices
    for (let i = 0; i < triangles.length; i += 3) {
      const ia = triangles[i]
      const ib = triangles[i + 1]
      const ic = triangles[i + 2]

      const va = geom3DVertices[ia]
      const vb = geom3DVertices[ib]
      const vc = geom3DVertices[ic]

      geomPositions.push(...va, ...vb, ...vc)
    }
  }

  const geomType = feature.geometry.type
  if (geomType === 'Polygon') {
    processPolygon(feature.geometry.coordinates)
  } else if (geomType === 'MultiPolygon') {
    feature.geometry.coordinates.forEach((polygon) => {
      processPolygon(polygon)
    })
  } else {
    console.warn('Unsupported geometry type for province:', geomType)
  }

  // If no positions generated, return null
  if (geomPositions.length === 0) {
    return null
  }

  const positionAttr = new Float32Array(geomPositions)
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positionAttr, 3))
  geometry.computeVertexNormals()

  const defaultMat = {
    color: 0xff5533,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    shininess: 10,
  }

  const material = new THREE.MeshPhongMaterial(Object.assign(defaultMat, materialOptions))
  const mesh = new THREE.Mesh(geometry, material)

  // attach properties for picking
  mesh.userData = Object.assign({}, feature.properties || {}, { isProvince: true })

  return mesh
}

// 添加边缘高亮效果
export function createProvinceWithEdgeHighlight(feature, options = {}) {
  const group = new THREE.Group()

  // 创建省份主体
  const provinceMesh = createProvinceMeshFromFeature(feature, options)
  if (provinceMesh) {
    group.add(provinceMesh)

    // 创建边缘高亮效果（使用背面材质）
    const edgeGeometry = provinceMesh.geometry.clone()
    const edgeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.BackSide
    })
    const edgeMesh = new THREE.Mesh(edgeGeometry, edgeMaterial)
    edgeMesh.scale.set(1.02, 1.02, 1.02) // 稍微放大创建轮廓效果
    group.add(edgeMesh)
  }

  group.userData = Object.assign({}, feature.properties || {}, { isProvince: true })

  return group
}

/**
 * 兼容旧的 processGeoJsonForThree：返回处理过的 features 简单映射
 */
export function processGeoJsonForThree(geoJson) {
  return geoJson.features.map((feature) => ({
    type: feature.type,
    properties: feature.properties,
    geometryType: feature.geometry.type,
  }))
}
