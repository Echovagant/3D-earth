/**
 * 两种看法的几何（§2.4 侧视图与极点俯视图）。
 *
 * 侧视图：横线是纬线，连接南北两极的弧是经线。
 * 极点俯视图：同心圆是纬线，从中心向四周放射的直线是经线，
 * 中心那个点是极点、最外圈是赤道。
 *
 * 俯视图的方位角是这一节最容易画反的地方，定死：
 *   0° 经线画在正下方，90°E 在正右方，180° 在正上方；
 *   经度沿逆时针方向增大——因为从北极上方俯视，地球自转是逆时针，
 *   而地球是自西向东转的，所以逆时针就是东。
 */
import { latitudeHalfWidth, latitudeY } from './latitudeCirclesGeometry'
import { meridianArcPath } from './meridianCirclesGeometry'

/** 极点俯视图里某条经线的方位角（度，0 在正右方、逆时针为正） */
export function polarMeridianAngle(lon) {
  return (270 + lon) % 360
}

/** 极点俯视图里某条纬线的半径 */
export function polarParallelRadius(lat, radius) {
  return latitudeHalfWidth(lat, radius)
}

/** 极点俯视图的经纬网（同心圆的半径只跟纬度与球半径有关，与圆心无关） */
export function polarViewGrid({ radius, parallels, meridians }) {
  return {
    parallels: parallels.map((lat) => ({ lat, r: polarParallelRadius(lat, radius) })),
    meridians: meridians.map((lon) => ({ lon, angle: polarMeridianAngle(lon) })),
  }
}

/** 侧视图的经纬网 */
export function sideViewGrid({ cx, cy, radius, parallels, meridians }) {
  return {
    parallels: parallels.map((lat) => ({
      lat,
      y: latitudeY(lat, cy, radius),
      half: latitudeHalfWidth(lat, radius),
    })),
    meridians: meridians.map((lon) => ({
      lon,
      d: meridianArcPath(cx, cy, radius, lon),
    })),
  }
}
