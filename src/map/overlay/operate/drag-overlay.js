import BMap from 'BMap'
import { getPolylineIncludeSpecials } from '../../calc/overlay'

let startPoint = null
let startPixel = null

function dragOverlay (baiduMap, overlay, options) {
  const { overlays, selectedOverlays } = options

  if (overlay.type.includes('rectangle')) {
    this.rectMarker(overlay, 6)
  }
  if (overlay.bindEvent) return

  const start = (e) => {
    dragStart(e, baiduMap)
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', end)
  }

  const move = (e) => {
    dragMove(e, baiduMap, { selectedOverlays })
  }

  const end = (e) => {
    dragEnd(e, { overlays, selectedOverlays })
    window.removeEventListener('mousemove', move)
    window.removeEventListener('mouseup', end)
  }

  overlay.bindEvent = true
  overlay.addEventListener('mousedown', start)
}

function dragStart (e, baiduMap) {
  try {
    e.domEvent.stopPropagation()
  } catch {
    e.stopPropagation()
  }
  startPixel = { x: e.clientX, y: e.clientY }
  startPoint = baiduMap.pixelToPoint(new BMap.Pixel(e.clientX, e.clientY))
}

function dragMove (e, baiduMap, options) {
  e.stopPropagation()
  const movePixel = { x: e.clientX, y: e.clientY }
  const movePoint = baiduMap.pixelToPoint(new BMap.Pixel(e.clientX, e.clientY))
  const { overlays, selectedOverlays } = options

  const dx = movePixel.x - startPixel.x
  const dy = movePixel.y - startPixel.y
  const dlng = movePoint.lng - startPoint.lng
  const dlat = movePoint.lat - startPoint.lat

  if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return
  for (let i = 0; i < selectedOverlays.length; i++) {
    const oly = selectedOverlays[i]
    const type = oly.type

    if (type.includes('special') || oly.disabled || oly.isLocked) {
      continue
    }

    if (['marker', 'label'].includes(type)) {
      const point = oly.getPosition()
      const mPoint = getPoint(point, dlng, dlat)

      oly.setPosition(mPoint)
    } else if (['circle'].includes(type)) {
      const point = oly.getCenter()
      const mPoint = getPoint(point, dlng, dlat)

      oly.setCenter(new BMap.Point(mPoint.lng, mPoint.lat))
    } else {
      setPath(oly, dlng, dlat)
      const specialOlys = getPolylineIncludeSpecials(oly, overlays)
      specialOlys.map(item => setPath(item, dlng, dlat))
    }

    oly.disableEditing()
  }
  startPixel = movePixel
  startPoint = movePoint
}

function dragEnd (e, options) {
  e.stopPropagation()

  const { overlays, selectedOverlays } = options

  selectedOverlays.map(oly => {
    const specials = getPolylineIncludeSpecials(oly, overlays)
    const type = oly.type
    let points = null
    try {
      points = [oly.getCenter()]
    } catch {
      try {
        points = oly.getPath()
      } catch {
        points = [oly.getPosition()]
      }
    }

    if (!type.includes('special') && specials.length === 0) {
      oly.enableEditing()
      if (type === 'rectangle') {
        this.rectMarker(oly)
      }
    }

    specials.push(oly)
    specials.map(item => {
      item.update('points', points)
    })
  })
}

function getPoint (point, dlng, dlat) {
  const mPoint = new BMap.Point(point.lng + dlng, point.lat + dlat)
  return mPoint
}

function setPath (oly, dlng, dlat) {
  const points = oly.getPath()
  const newPoints = []
  points.map(point => {
    const mPoint = getPoint(point, dlng, dlat)
    newPoints.push(new BMap.Point(mPoint.lng, mPoint.lat))
  })
  oly.setPath(newPoints)
}

export {
  dragOverlay
}
