// GeoJSON 数据处理工具：将 GeoJSON 多边形三角化并映射到球面
import * as THREE from 'three'
import earcut from 'earcut'

// 描边相对面抬高的高度，避免与面共面产生 z-fighting
const OUTLINE_LIFT = 0.004

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
  const { radius = 2, elevation = 0.02, materialOptions = {}, lineColor } = options

  const geomPositions = [] // will hold flattened triangle vertex coords
  const outlinePositions = [] // 描边线段的端点坐标

  // helper to process a single polygon (array of rings)
  const processPolygon = (rings) => {
    const flat2D = [] // [x0,y0, x1,y1, ...] for earcut
    const holeIndices = []

    // 顶点表必须每个 polygon 重建：earcut 的索引在每个 polygon 内从 0 开始，
    // 若跨 polygon 累加，第 2 个及以后的 polygon 会错位引用第 1 个 polygon 的顶点，
    // 导致多岛屿省份（海南、台湾、浙江、广东…）只渲染出第一个 polygon。
    const geom3DVertices = [] // temporary list of vertex 3D coords for this polygon

    // For mapping 2D indices back to 3D coords, push 3D per coordinate in same order
    rings.forEach((ring, rIndex) => {
      if (rIndex > 0) {
        // hole start index is current number of points
        holeIndices.push(flat2D.length / 2)
      }

      const loop = []
      ring.forEach((coord) => {
        const [lon, lat] = coord
        flat2D.push(lon, lat)
        const [x, y, z] = lonLatToCartesian(lon, lat, radius + elevation)
        geom3DVertices.push([x, y, z])
        // 描边抬高一点点，避免与面共面产生 z-fighting
        loop.push(lonLatToCartesian(lon, lat, radius + elevation + OUTLINE_LIFT))
      })

      // 把环首尾相接，生成线段端点
      for (let i = 0; i < loop.length; i++) {
        const a = loop[i]
        const b = loop[(i + 1) % loop.length]
        outlinePositions.push(a[0], a[1], a[2], b[0], b[1], b[2])
      }
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

  // 描边：WebGL 的 LineBasicMaterial 不支持 linewidth（除少数平台外恒为 1px），
  // 所以只提供 lineColor，不提供 lineWidth 这种会被静默忽略的选项。
  if (lineColor !== undefined && outlinePositions.length > 0) {
    const outlineGeometry = new THREE.BufferGeometry()
    outlineGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(outlinePositions, 3),
    )
    const outlineMaterial = new THREE.LineBasicMaterial({
      color: lineColor,
      transparent: true,
      opacity: 0.9,
    })
    const outline = new THREE.LineSegments(outlineGeometry, outlineMaterial)
    outline.name = 'outline'
    outline.renderOrder = 1
    mesh.add(outline)
  }

  // attach properties for picking
  mesh.userData = Object.assign({}, feature.properties || {}, { isProvince: true })

  return mesh
}
