import { isPointInRect } from './geo'

function calcMarkerOnLinePosition (point, polyline, isDrag) {
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
  calcMarkerOnLinePosition
}
