import BMap from 'BMap'

/**
 * 吸附打点
 * @param e
 */
function adsorbOverlay (map, point, polylineOverlays) {
  /**
   * 反余弦函数计算角度
   * @param scale 角的邻边比斜边
   * @returns {number}
   */
  const radianToAngle = (scale) => {
    const radian = Math.acos(scale)
    const angle = 180 / Math.PI * radian
    return angle
  }
  /**
   * 勾股定理求出最大边
   * @param ops 对边
   * @param abj 邻边
   * @returns {number}
   */
  const pythagorean = (ops, abj) => {
    return Math.sqrt(Math.pow(ops, 2) + Math.pow(abj, 2))
  }

  /**
   * 求弧公式
   * @param angle
   * @returns {number}
   */
  const angleToRadian = (angle) => {
    return 2 * Math.PI / 360 * angle
  }

  /**
   * 获取点x轴y轴
   */
  const getPointXAndY = (A, B, C) => {
    let pointX = null
    let pointY = null
    let opposite = null
    if (A.lng === B.lng) { // x轴相等
      pointX = A.lng || B.lng
      pointY = C.lat
      opposite = C.lng > pointX ? C.lng - pointX : pointX - C.lng
    } else if (A.lat === B.lat) { // y轴相等
      pointX = C.lng
      pointY = A.lat || B.lat
      opposite = C.lat > pointY ? C.lat - pointY : pointY - C.lat
    }
    return { pointX, pointY, opposite }
  }

  /**
   *  设置多种情况的X及Y的坐标
   */
  const setMoreHap = (YSTATUS, XSTATUS, bigAbj, bigOps, A, B) => {
    let pointX = B.lng - bigAbj
    let pointY = B.lat + bigOps
    if (YSTATUS && !XSTATUS) {
      pointX = B.lng + bigAbj
    } else if (!YSTATUS && !XSTATUS) {
      pointX = A.lng - bigAbj
      pointY = A.lat + bigOps
    } else if (!YSTATUS && XSTATUS) {
      pointX = A.lng + bigAbj
      pointY = A.lat + bigOps
    }
    return { pointX, pointY }
  }

  /**
   * 获取形成三角型的xy坐标
   */
  const getAriangleXY = (A, B, C, YSTATUS, XSTATUS) => {
    let cY = C.lat - B.lat
    let cX = B.lng - C.lng
    if (YSTATUS && !XSTATUS) { // 起点y 和 x 都大
      cX = C.lng - B.lng
    } else if (!YSTATUS && !XSTATUS) { // 起点y小 且终点x小
      cY = C.lat - A.lat
      cX = A.lng - C.lng
    } else if (!YSTATUS && XSTATUS) { // 起点y小 且终点x大
      cY = C.lat - A.lat
      cX = C.lng - A.lng
    }
    return { cY, cX }
  }
  /**
   * 计算点线最小距离以及吸附点的X和Y坐标
   * @param A
   * @param B
   * @param C
   * @returns {{bigOps: *, ops: *, bigAbj: *}}
   */
  const calcSmallOpsBigAndHyp = ({ A, B, C, Bounds, overlay }) => {
    let { pointX, pointY, opposite } = getPointXAndY(A, B, C)
    if (!pointX) {
      // X和Y轴非平行的情况
      const YSTATUS = A.lat > B.lat // 正常情况 y轴的大小情况
      const XSTATUS = B.lng > A.lng // 正常情况 x轴大小的情况
      const AInRect = isPointInRect(A, Bounds)
      const BInRect = isPointInRect(B, Bounds)
      // 目标线段三角形
      const Y1 = Math.abs(A.lat - B.lat)
      const X1 = Math.abs(B.lng - A.lng)
      // const L1 = Math.sqrt(Math.pow(Y1, 2) + Math.pow(X1, 2))
      const L1 = pythagorean(Y1, X1)
      // 目标线段大夹角
      const bigAngle = radianToAngle(X1 / L1)

      // 鼠标点的三条边 及 与 X轴的夹角
      const { cY, cX } = getAriangleXY(A, B, C, YSTATUS, XSTATUS)

      const cL = pythagorean(cY, cX)
      const smallAngle = radianToAngle(cX / cL)

      // 最小距离 - 夹角 - 弧度
      const angle = bigAngle - smallAngle
      const radian = angleToRadian(angle)
      opposite = Math.sin(radian) * cL

      // 吸附点三角形 对边 邻边 斜边
      const bigRadian = angleToRadian(bigAngle)
      const raC = Math.cos(radian) * cL
      const bigAbj = Math.cos(bigRadian) * raC
      const bigOps = Math.sin(bigRadian) * raC

      //  多边形形成夹角的情况
      const moreHap = setMoreHap(YSTATUS, XSTATUS, bigAbj, bigOps, A, B)
      pointX = moreHap.pointX
      pointY = moreHap.pointY

      // 处理边界值 有一个点在交集区域切最小距离点不在线上
      const pointTemp = new BMap.Point(pointX, pointY)
      const isOnLine = findMarkerOnLinePosition(pointTemp, overlay)
      if (AInRect && BInRect && isOnLine === -1) { // 两个都在交集区域内
        const cToA = map.getDistance(A, C)
        const cToB = map.getDistance(B, C)
        if (cToA < cToB) {
          pointX = A.lng
          pointY = A.lat
        } else {
          pointX = B.lng
          pointY = B.lat
        }
      } else if (AInRect && isOnLine === -1) { // 起点在区域
        pointX = A.lng
        pointY = A.lat
      } else if (BInRect && isOnLine === -1) { // 终点在区内
        pointX = B.lng
        pointY = B.lat
      }
      return {
        opposite,
        pointX,
        pointY
      }
    }
  }

  // 清除交集点
  const allOverlay = map.getOverlays()
  const removedOverlays = allOverlay.filter(o => o.adsorption)
  if (removedOverlays.length > 0) {
    removedOverlays.map(r => {
      map.removeOverlay(r)
    })
  }

  // 计算点的位置
  const recentOly = { point: null, polyline: null, opposite: null }
  const CirclePoint = new BMap.Point(point.lng, point.lat)
  const circle = new BMap.Circle(CirclePoint, 150)
  circle.adsorption = true
  circle.hide()
  map.addOverlay(circle)
  const circleBounds = circle.getBounds()
  const mapBounds = map.getBounds()
  polylineOverlays.forEach(oly => {
    const path = oly.getPath()
    path.forEach((p, i) => {
      if (i < path.length - 2) {
        const findP = mapBounds.containsPoint(p)
        if (findP) {
          const point1 = new BMap.Point(p.lng, p.lat)
          const point2 = new BMap.Point(Object(path[i + 1]).lng, Object(path[i + 1]).lat)
          const tempLine = new BMap.Polyline([point1, point2])
          tempLine.adsorption = true
          map.addOverlay(tempLine)
          tempLine.hide()
          const lineBounds = tempLine.getBounds()
          const intersects = lineBounds.intersects(circleBounds)
          if (intersects) {
            const currentPoint = calcSmallOpsBigAndHyp({
              A: p,
              B: Object(path[i + 1]),
              C: point,
              Bounds: circleBounds,
              overlay: oly
            })
            if (!recentOly.opposite || currentPoint.opposite < recentOly.opposite) {
              Object.assign(recentOly, {
                point: new BMap.Point(currentPoint.pointX, currentPoint.pointY),
                polyline: oly,
                opposite: currentPoint.opposite
              })
            }
          }
        }
      }
    })
  })
  // 打点范围
  if (recentOly.point) {
    const targetPoint = recentOly.point
    const currentToTargetPixel = pixelDistance(map, point, targetPoint)
    if (currentToTargetPixel > 16) {
      return { point: null, polyline: null }
    }
  }
  delete recentOly.opposite
  return recentOly
}

function pixelDistance (map, pointA, pointB) {
  const pixelA = map.pointToPixel(pointA)
  const pixelB = map.pointToPixel(pointB)
  const pixelDx = Math.abs(pixelA.x - pixelB.x)
  const pixelDy = Math.abs(pixelA.y - pixelB.y)
  return Math.sqrt(Math.pow(pixelDx, 2) + Math.pow(pixelDy, 2))
}

function isPointInRect (point, bounds) {
  if (!(point instanceof BMap.Point) ||
    !(bounds instanceof BMap.Bounds)) {
    return false
  }
  const sw = bounds.getSouthWest()
  const ne = bounds.getNorthEast()
  return (point.lng >= sw.lng && point.lng <= ne.lng && point.lat >= sw.lat && point.lat <= ne.lat)
}

function findMarkerOnLinePosition (point, polyline, isDrag) {
  const lineBounds = polyline.getBounds()
  if (!isPointInRect(point, lineBounds)) {
    return -1
  }

  const pts = polyline.getPath()
  for (let i = 0; i < pts.length - 1; i++) {
    const curPt = pts[i]
    const nextPt = pts[i + 1]
    if (point.lng >= Math.min(curPt.lng, nextPt.lng) && point.lng <= Math.max(curPt.lng, nextPt.lng) &&
      point.lat >= Math.min(curPt.lat, nextPt.lat) && point.lat <= Math.max(curPt.lat, nextPt.lat)) {
      if (isDrag) {
        // 判断点是否在直线上公式
        const precision = (curPt.lng - point.lng) * (nextPt.lat - point.lat) -
          (nextPt.lng - point.lng) * (curPt.lat - point.lat)
        if (precision < 2e-6 && precision > -2e-6) { // 实质判断是否接近0
          return i
        }
      } else {
        return i
      }
    }
  }
  return -1
}

export {
  adsorbOverlay
}
