import { scaleSpecs, zoomSpecs } from '../../constants'
import { calcOnePixelToPoint } from './point'
import { calcPixelDistance, distanceToPointAndPixel } from './distance'
import { getSpecialAttachPolyline } from './overlay'

function calcOverlayPixel (map, overlay) {
  const bounds = overlay.getBounds()
  const sw = bounds.getSouthWest()
  const ne = bounds.getNorthEast()
  return calcPixelDistance(map, sw, ne)
}

function calcOverlayGrid (area, lng, lat, oly) {
  var levels = {
    polyline: 0,
    marker: 1,
    polygon: 2,
    label: 3
  }
  const areaKey = `[${lng}, ${lat}]`
  if (!area[areaKey]) area[areaKey] = []
  if (area[areaKey].length === 0) {
    oly.show()
    area[areaKey] = oly
    oly.area.push(areaKey)
  } else if (area[areaKey].id !== oly.id) {
    // 按照优先级显示 点(全显示)-线（特殊）-面
    const areaKeyOly = area[areaKey]
    const areaKeyLevel = levels[areaKeyOly.type]
    const curLevel = levels[oly.type]

    if ((areaKeyLevel === curLevel && areaKeyOly.pixel < oly.pixel) ||
      areaKeyLevel > curLevel) {
      // 元件贯穿网格
      if (areaKeyOly.area.length > 0) {
        const idx = areaKeyOly.area.findIndex(item => item === areaKey)
        if (idx > -1) areaKeyOly.area.splice(idx, 1)
      }
      if (areaKeyOly.area.length === 0) areaKeyOly.hide()
      oly.show()
      area[areaKey] = oly
    } else {
      oly.hide()
    }
  }
}

function showOverlay (map, area, sw, ne, oly) {
  const mapBounds = map.getBounds()
  const mapSw = mapBounds.getSouthWest()
  const mapNe = mapBounds.getNorthEast()
  const dLng = Math.abs(mapSw.lng - mapNe.lng)
  const dLat = Math.abs(mapSw.lat - mapNe.lat)
  const count = 20
  const entry = { lng: dLng / count, lat: dLat / count }
  const startLng = Math.ceil(Math.abs(sw.lng - mapSw.lng) / entry.lng)
  const startLat = Math.ceil(Math.abs(sw.lat - mapSw.lat) / entry.lng)
  const endLng = Math.ceil(Math.abs(ne.lng - mapSw.lng) / entry.lng)
  const endLat = Math.ceil(Math.abs(ne.lat - mapSw.lat) / entry.lng)

  calcOverlayGrid(area, startLng, startLat, oly)
  calcOverlayGrid(area, endLng, endLat, oly)
}

function showSpecialOverlay (map, overlays, specialOverlays) {
  const zoom = map.getZoom()

  if (zoom >= 15) return

  for (const key in specialOverlays) {
    const specials = specialOverlays[key]
    const polyline = getSpecialAttachPolyline(specials[0], overlays)
    specials.map(oly => {
      try {
        if (polyline.isVisible() && oly.visible) oly.show()
        else oly.hide()
      } catch {
        oly.hide()
      }
    })
  }
}

function clustererOverlays (options) { // 覆盖物聚合
  const { map, overlays, specialOverlays } = options
  const zoom = map.getZoom()
  const area = {}

  for (const oly of overlays) {
    const type = oly.type

    oly.area = []
    if (!oly.visible) {
      continue
    }
    if (zoom >= 15) {
      oly.show()
      continue
    }
    // 点一直显示、线在图上超过10px显示
    if (type === 'marker') {
      oly.pixel = oly.width
    } else if (type.includes('special')) {
      continue
    } else if (type === 'polyline' || ['polygon', 'circle', 'rectangle'].includes(type)) {
      const pixel = calcOverlayPixel(map, oly)
      oly.pixel = pixel
      if (pixel < 10) {
        oly.hide()
        continue
      }
    }
    try {
      const bounds = oly.getBounds()
      const sw = bounds.getSouthWest()
      const ne = bounds.getNorthEast()
      showOverlay(map, area, sw, ne, oly)
    } catch {
      const point = oly.getPosition()
      const size = parseFloat(oly.width)
      const dPoint = calcOnePixelToPoint(map)
      const swPoint = {
        lng: point.lng - size / 2 * dPoint.lng,
        lat: point.lat - size / 2 * dPoint.lat
      }
      const nePoint = {
        lng: point.lng + size / 2 * dPoint.lng,
        lat: point.lat + size / 2 * dPoint.lat
      }
      showOverlay(map, area, swPoint, nePoint, oly)
    }
    zoomSpecialOverlayPixel(map, oly)
  }
  setTimeout(() => {
    showSpecialOverlay(map, overlays, specialOverlays)
  })
}

function zoomSpecialOverlayPixel (map, overlay) {
  if (overlay.invented) {
    const wPixel = Math.abs(distanceToPointAndPixel(map, overlay.width).wPixel)
    overlay.setStrokeWeight(wPixel * 2)
  }
}

function showOverlays (options) {
  const { map, mapType, overlays, zoomSettings } = options
  const zoom = map.getZoom()
  const zoomMap = {}

  if (mapType === 'graphic') return

  for (const overlayType in zoomSettings) {
    const scale = zoomSettings[overlayType]
    const idx = scaleSpecs.indexOf(scale)
    zoomMap[overlayType] = zoomSpecs[idx]
  }
  overlays.map(oly => {
    let { type, projectGeoKey } = oly
    if (type.includes('special')) {
      type = 'special'
    } else if (type === 'polyline') {
      type = projectGeoKey ? 'uploadPolyline' : type
    } else if (['circle', 'rectangle', 'polygon'].includes(type)) {
      type = 'polygon'
    }
    if (zoom >= zoomMap[type]) {
      oly.show()
    } else {
      oly.hide()
    }
  })
}

export {
  clustererOverlays,
  showOverlays
}
