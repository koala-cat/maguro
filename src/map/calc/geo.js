import BMap from 'BMap'

function isOverlayInFrame (overlay, rectOverlay) {
  const bounds = rectOverlay.getBounds()
  const type = overlay.type

  let result = false
  let parentId = null

  if (!overlay.disabled && type !== 'hotspot') {
    if (type === 'marker' || type === 'label') {
      const point = [overlay.getPosition()]
      result = isPointInRect(point, bounds)
    } else if (type === 'polyline') {
      result = isPointInRect(overlay.getPath(), bounds)
    } else if (type.includes('special')) {
      if (overlay.invented) {
        parentId = overlay.parentId
        result = isPolygonInRect(overlay.getBounds(), bounds)
      }
    } else {
      result = isPolygonInRect(overlay.getBounds(), bounds)
    }
  }
  result = result && overlay.isVisible()
  return { result, parentId }
}

function isPointInRect (points, bounds) {
  points = (Array.isArray(points) ? points : [points])

  let result = true
  for (const p of points) {
    if (!(p instanceof BMap.Point) ||
      !(bounds instanceof BMap.Bounds)) {
      return false
    }
    const sw = bounds.getSouthWest()
    const ne = bounds.getNorthEast()
    result = (p.lng >= sw.lng && p.lng <= ne.lng && p.lat >= sw.lat && p.lat <= ne.lat)
  }
  return result
}

function isPolygonInRect (plyBounds, rectBounds) {
  return rectBounds.containsBounds(plyBounds)
}

export {
  isOverlayInFrame,
  isPointInRect,
  isPolygonInRect
}
